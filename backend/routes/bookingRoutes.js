const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');

const ExpertService = require('../models/ExpertService');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Setting = require('../models/Setting');

// @route   POST /api/bookings
// @desc    Create a new booking (consultation)
// @access  Private (USER only)
router.post('/', protect, authorizeRoles('USER'), async (req, res) => {
  try {
    const { expertId, serviceId, date, time, type, duration, notes } = req.body;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    let ratePerMinute = expert.rates ? expert.rates[type.toLowerCase()] : (expert.pricePerMinute || 20);
    const consultationDuration = duration || 45;
    
    let basePrice = ratePerMinute * consultationDuration;
    
    // If booked via a specific service, use the service price as total price
    if (serviceId) {
      const service = await ExpertService.findById(serviceId);
      if (service && service.expertId.toString() === expertId.toString()) {
        basePrice = service.price;
        // Optionally update service bookings count here or after payment
      }
    }

    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const commissionRate = (settings && settings.platformCommissionRate) ? (settings.platformCommissionRate / 100) : 0.20;
    
    const platformFee = Number((basePrice * commissionRate).toFixed(2));
    const amount = Number((basePrice + platformFee).toFixed(2));

    // Parse date and time properly
    const startTime = new Date(date);
    // Optional: could parse 'time' string ("10:00 AM") and set it to startTime.
    
    // Convert 'Video'/'Audio'/'Chat' to match schema ('video', 'call', 'chat')
    let schemaType = 'video';
    if (type.toLowerCase() === 'audio') schemaType = 'call';
    if (type.toLowerCase() === 'chat') schemaType = 'chat';

    const consultation = new Consultation({
      user: req.user._id,
      expert: expertId,
      service: serviceId || null,
      startTime: startTime,
      durationInMinutes: consultationDuration,
      status: 'pending', 
      paymentStatus: 'pending',
      type: schemaType,
      cost: amount,
      expertEarning: basePrice,
      platformFee: platformFee
    });
    
    // Set meeting link dynamically pointing to our WebRTC live session route
    consultation.meetingLink = `/live/${consultation._id}`;

    await consultation.save();
    res.status(201).json(consultation);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get logged in user's bookings
// @access  Private (USER)
router.get('/my-bookings', protect, authorizeRoles('USER'), async (req, res) => {
  try {
    const consultations = await Consultation.find({ user: req.user._id })
      .populate('expert', 'name profileImage categoryId specialty')
      .sort({ startTime: -1 });
    
    res.json(consultations);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get a specific booking by ID
// @access  Private (USER or EXPERT)
router.get('/:id', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('user', 'name profileImage')
      .populate('expert', 'name profileImage');
      
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }
    
    // Make sure the logged in user is either the expert or the user of this consultation
    if (consultation.user._id.toString() !== req.user._id.toString() && 
        consultation.expert._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view this consultation' });
    }

    res.json(consultation);
  } catch (error) {
    console.error('Fetch booking error:', error);
    res.status(500).json({ message: 'Failed to fetch booking' });
  }
});

// @route   GET /api/bookings/active-chat/:partnerId
// @desc    Get active chat consultation with a specific partner
// @access  Private (USER or EXPERT)
router.get('/active-chat/:partnerId', protect, async (req, res) => {
  try {
    const isExpert = req.user.role === 'EXPERT';
    const query = {
      type: 'chat',
      status: { $in: ['scheduled', 'ongoing'] }
    };

    if (isExpert) {
      query.expert = req.user._id;
      query.user = req.params.partnerId;
    } else {
      query.user = req.user._id;
      query.expert = req.params.partnerId;
    }

    const consultation = await Consultation.findOne(query).sort({ startTime: 1 });
    if (!consultation) {
      return res.status(404).json({ message: 'No active chat consultation found' });
    }

    // if scheduled, we might want to mark it as ongoing since they are checking it in chat
    if (consultation.status === 'scheduled') {
      // Actually we let frontend or another action mark it ongoing, but we return it anyway
    }

    res.json(consultation);
  } catch (error) {
    console.error('Fetch active chat error:', error);
    res.status(500).json({ message: 'Failed to fetch active chat consultation' });
  }
});

// @route   POST /api/bookings/:id/end
// @desc    End a consultation and process pro-rata payment
// @access  Private (USER or EXPERT)
router.post('/:id/end', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).populate('expert').populate('user');
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      return res.status(400).json({ message: 'Consultation is already ended' });
    }

    let { actualDuration } = req.body;
    // Default to the booked duration if not provided
    if (!actualDuration || actualDuration > consultation.durationInMinutes) {
      actualDuration = consultation.durationInMinutes;
    }

    const expert = consultation.expert;
    const user = consultation.user;

    // Calculate actual cost
    const ratePerMinute = expert.rates ? expert.rates[consultation.type.toLowerCase()] : (expert.pricePerMinute || 500);
    const actualBasePrice = actualDuration * ratePerMinute;
    
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const commissionRate = (settings && settings.platformCommissionRate) ? (settings.platformCommissionRate / 100) : 0.20;

    const actualPlatformFee = Number((actualBasePrice * commissionRate).toFixed(2));
    const actualTotalCost = Number((actualBasePrice + actualPlatformFee).toFixed(2));

    const originalCost = consultation.cost;
    const refundAmount = originalCost > actualTotalCost ? (originalCost - actualTotalCost) : 0;
    
    const finalEarning = actualBasePrice; // Expert gets base price
    const finalPlatformFee = actualPlatformFee; // Platform gets platform fee

    // Credit Expert
    const expertBalanceBefore = expert.walletBalance || 0;
    expert.walletBalance = expertBalanceBefore + finalEarning;
    await expert.save();

    const expertTx = new WalletTransaction({
      user: expert._id,
      type: 'CREDIT',
      amount: finalEarning,
      status: 'SUCCESS',
      balanceBefore: expertBalanceBefore,
      balanceAfter: expert.walletBalance,
      description: `Earnings for ${actualDuration}m ${consultation.type} session`,
      consultation: consultation._id,
      completedAt: new Date()
    });
    await expertTx.save();

    // Refund User (if any)
    if (refundAmount > 0) {
      const userBalanceBefore = user.walletBalance || 0;
      user.walletBalance = userBalanceBefore + refundAmount;
      await user.save();

      const refundTx = new WalletTransaction({
        user: user._id,
        type: 'REFUND',
        amount: refundAmount,
        status: 'SUCCESS',
        balanceBefore: userBalanceBefore,
        balanceAfter: user.walletBalance,
        description: `Refund for unused ${consultation.durationInMinutes - actualDuration}m of ${consultation.type} session`,
        consultation: consultation._id,
        completedAt: new Date()
      });
      await refundTx.save();
    }

    // Update Consultation
    consultation.status = 'completed';
    consultation.cost = actualTotalCost;
    consultation.expertEarning = finalEarning;
    consultation.platformFee = finalPlatformFee;
    consultation.durationInMinutes = actualDuration; // update to actual
    await consultation.save();

    res.json({ message: 'Session ended successfully', consultation });
  } catch (error) {
    console.error('End session error:', error);
    try { require('fs').appendFileSync('error_log.txt', 'End session error: ' + error.stack + '\n'); } catch (e) {}
    res.status(500).json({ message: 'Failed to end session' });
  }
});

module.exports = router;
