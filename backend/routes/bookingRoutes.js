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
    let schemaType = 'call';
    const lowerType = (type || '').toLowerCase();
    if (lowerType === 'video') schemaType = 'video';
    else if (lowerType === 'chat') schemaType = 'chat';
    else schemaType = 'call'; // 'audio', 'call', or any voice booking defaults to 'call'

    // Check if user has at least 1 minute minimum balance in wallet to connect
    const user = await User.findById(req.user._id);
    const minRequired = ratePerMinute;
    if (!user || (user.walletBalance || 0) < minRequired) {
      return res.status(400).json({ 
        message: `Insufficient balance. Minimum ₹${minRequired} (1 minute) required in your wallet to start.`,
        requiredBalance: minRequired,
        currentBalance: user ? (user.walletBalance || 0) : 0
      });
    }

    const isInstant = req.body.isInstant !== undefined ? req.body.isInstant : !serviceId;
    const initialStatus = isInstant ? 'ongoing' : 'pending';

    const consultation = new Consultation({
      user: req.user._id,
      expert: expertId,
      service: serviceId || null,
      startTime: startTime,
      durationInMinutes: consultationDuration,
      status: initialStatus, 
      paymentStatus: 'pending',
      type: schemaType,
      cost: amount,
      expertEarning: basePrice,
      platformFee: platformFee
    });
    
    // Set meeting link dynamically pointing to our WebRTC live session route
    consultation.meetingLink = `/live/${consultation._id}`;

    await consultation.save();

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    // Emit live socket event to both user and expert so their chat UI auto-refreshes instantly!
    if (io) {
      io.to(`user_${req.user._id}`).emit('new_chat_consultation', {
        consultationId: consultation._id,
        type: schemaType,
        partnerId: expert._id,
        partnerModel: 'Expert',
        consultation
      });
      io.to(`user_${expert._id}`).emit('new_chat_consultation', {
        consultationId: consultation._id,
        type: schemaType,
        partnerId: req.user._id,
        partnerModel: 'User',
        consultation
      });
    }

    // 1. Dynamic Notification to User: Booking Confirmed (non-blocking)
    sendNotification({
      recipient: req.user._id,
      recipientRole: 'USER',
      recipientModel: 'User',
      title: 'Booking Confirmed',
      message: `Your consultation with ${expert.name} has been confirmed for ${new Date(startTime).toLocaleDateString()}.`,
      actionText: 'Open booking details',
      link: schemaType === 'chat' ? '/messages' : '/bookings',
      type: 'booking_confirmed',
      badge: 'New'
    }, io).catch(e => console.error('Booking notif user error:', e));

    // 2. Dynamic Notification to Expert: New Consultation Request (non-blocking)
    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'New Consultation Request',
      message: `${req.user.name || 'A client'} requested a ${consultationDuration}-minute ${schemaType} consultation.`,
      actionText: schemaType === 'chat' ? 'Open Chat & Reply' : 'View request · Accept or reject',
      link: schemaType === 'chat' ? '/expert/messages' : '/expert/consultations',
      type: 'consultation_request',
      badge: 'New'
    }, io).catch(e => console.error('Booking notif expert error:', e));

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
    const Review = require('../models/Review');
    const consultations = await Consultation.find({ user: req.user._id })
      .populate('expert', 'name profileImage categoryId specialty')
      .sort({ startTime: -1 });

    // Fetch existing reviews submitted by this user
    const userReviews = await Review.find({ user: req.user._id }).select('consultation rating feedback');
    const reviewMap = new Map();
    userReviews.forEach(r => reviewMap.set(r.consultation.toString(), r));

    const result = consultations.map(c => {
      const cObj = c.toObject();
      const existingReview = reviewMap.get(c._id.toString());
      cObj.hasReviewed = !!existingReview;
      cObj.review = existingReview || null;
      return cObj;
    });
    
    res.json(result);
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
    // 1. ATOMIC LOCK: Only ONE request can ever change status from ongoing/pending/scheduled to completed
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, status: { $nin: ['completed', 'cancelled'] } },
      { $set: { status: 'completed' } },
      { new: false } // return previous document state
    ).populate('expert').populate('user');

    if (!consultation) {
      // Idempotency: If consultation exists and is already completed/cancelled, return 200 success
      const existing = await Consultation.findById(req.params.id).populate('expert').populate('user');
      if (existing) {
        return res.status(200).json({ 
          message: 'Consultation is already ended or settled', 
          consultation: existing 
        });
      }
      return res.status(404).json({ message: 'Consultation not found' });
    }

    let { actualDuration } = req.body;
    actualDuration = Number(actualDuration) || 0.01;
    if (actualDuration <= 0) actualDuration = 0.01;

    const expert = consultation.expert;
    const user = consultation.user;

    // Calculate actual cost safely
    const consultType = (consultation.type || 'video').toLowerCase();
    const ratePerMinute = expert?.rates 
      ? (expert.rates[consultType] || expert.pricePerMinute || 30) 
      : (expert?.pricePerMinute || 30);
    const actualBasePrice = Number((actualDuration * ratePerMinute).toFixed(2));
    
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const commissionRate = (settings && settings.platformCommissionRate) ? (settings.platformCommissionRate / 100) : 0.20;

    const actualPlatformFee = Number((actualBasePrice * commissionRate).toFixed(2));
    const actualTotalCost = Number((actualBasePrice + actualPlatformFee).toFixed(2));

    const finalEarning = actualBasePrice; // Expert base price
    const finalPlatformFee = actualPlatformFee; // Platform fee

    // Check if this consultation was pre-paid upfront or Pay-As-You-Go (post-paid)
    if (consultation.paymentStatus === 'paid') {
      // PRE-PAID CASE: Money was already deducted upfront; refund difference with duplicate check
      const originalCost = consultation.cost;
      const refundAmount = originalCost > actualTotalCost ? Number((originalCost - actualTotalCost).toFixed(2)) : 0;

      const existingRefund = await WalletTransaction.findOne({
        consultation: consultation._id,
        type: 'REFUND'
      });

      if (refundAmount > 0 && !existingRefund) {
        const userBalanceBefore = user.walletBalance || 0;
        user.walletBalance = Number((userBalanceBefore + refundAmount).toFixed(2));
        await user.save();

        const refundTx = new WalletTransaction({
          user: user._id,
          type: 'REFUND',
          amount: refundAmount,
          status: 'SUCCESS',
          balanceBefore: userBalanceBefore,
          balanceAfter: user.walletBalance,
          description: `Refund for unused time in ${consultation.type} session`,
          consultation: consultation._id,
          completedAt: new Date()
        });
        await refundTx.save();
      }

      // Credit Expert if not already credited
      const existingCredit = await WalletTransaction.findOne({
        consultation: consultation._id,
        type: 'CREDIT'
      });

      if (!existingCredit) {
        const expertBalanceBefore = expert.walletBalance || 0;
        expert.walletBalance = Number((expertBalanceBefore + finalEarning).toFixed(2));
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
      }
    } else {
      // PAY-AS-YOU-GO CASE (Astrotalk style): No upfront deduction occurred!
      // Debit user wallet for exact duration used, capped at available balance
      const existingDebit = await WalletTransaction.findOne({
        consultation: consultation._id,
        type: 'DEBIT'
      });

      if (!existingDebit) {
        const userBalanceBefore = user.walletBalance || 0;
        const debitAmount = Number(Math.min(actualTotalCost, userBalanceBefore).toFixed(2));
        user.walletBalance = Number(Math.max(0, userBalanceBefore - debitAmount).toFixed(2));
        await user.save();

        const debitTx = new WalletTransaction({
          user: user._id,
          type: 'DEBIT',
          amount: debitAmount,
          status: 'SUCCESS',
          balanceBefore: userBalanceBefore,
          balanceAfter: user.walletBalance,
          description: `Payment for ${actualDuration}m ${consultation.type} session`,
          consultation: consultation._id,
          completedAt: new Date()
        });
        await debitTx.save();

        // Credit Expert
        const existingCredit = await WalletTransaction.findOne({
          consultation: consultation._id,
          type: 'CREDIT'
        });

        if (!existingCredit) {
          const expertBalanceBefore = expert.walletBalance || 0;
          expert.walletBalance = Number((expertBalanceBefore + finalEarning).toFixed(2));
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
        }
      }
    }

    // Finalize Consultation record
    await Consultation.findByIdAndUpdate(consultation._id, {
      cost: actualTotalCost,
      expertEarning: finalEarning,
      platformFee: finalPlatformFee,
      durationInMinutes: actualDuration,
      paymentStatus: 'paid'
    });

    // Mark associated VideoSession as COMPLETED
    const VideoSession = require('../models/VideoSession');
    await VideoSession.updateMany(
      { consultationId: consultation._id },
      { $set: { status: 'COMPLETED', endedAt: new Date() } }
    ).catch(()=>{});

    const io = req.app.get('io');
    if (io) {
      // Broadcast consultation end event to call room and user rooms
      io.to(`call_room_${consultation._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
      io.to(`call_room_${consultation._id}`).emit('session_ended', {
        consultationId: consultation._id,
        reason: req.body.reason || 'Session ended'
      });

      if (user?._id) {
        io.to(`user_${user._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
        io.to(`user_${user._id}`).emit('session_ended', {
          consultationId: consultation._id,
          reason: req.body.reason || 'Session ended'
        });
      }
      if (expert?._id) {
        io.to(`user_${expert._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
        io.to(`user_${expert._id}`).emit('session_ended', {
          consultationId: consultation._id,
          reason: req.body.reason || 'Session ended'
        });
      }
    }

    const { sendNotification } = require('../utils/notificationDispatcher');

    // Dynamic Notification to User: Rate Your Consultation
    await sendNotification({
      recipient: user._id,
      recipientRole: 'USER',
      recipientModel: 'User',
      title: 'Rate Your Consultation',
      message: `Share your feedback about your completed session with ${expert.name}.`,
      actionText: 'Write a review',
      link: '/bookings',
      type: 'rate_consultation',
      badge: 'New'
    }, io);

    // Dynamic Notification to Expert: Earnings Update
    await sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Earnings Update',
      message: `You earned ₹${finalEarning.toFixed(2)} from your completed consultation with ${user.name || 'Client'}.`,
      actionText: 'View earnings',
      link: '/expert/earnings',
      type: 'earnings_update',
      badge: 'New'
    }, io);

    res.json({ message: 'Session ended successfully', consultation });
  } catch (error) {
    console.error('End session error:', error);
    try { require('fs').appendFileSync('error_log.txt', 'End session error: ' + error.stack + '\n'); } catch (e) {}
    res.status(500).json({ message: 'Failed to end session' });
  }
});

module.exports = router;
