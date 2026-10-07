const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');

const ExpertService = require('../models/ExpertService');

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

    let basePrice = expert.rates ? expert.rates[type.toLowerCase()] : (expert.pricePerMinute || 500);
    
    // If booked via a specific service, use the service price
    if (serviceId) {
      const service = await ExpertService.findById(serviceId);
      if (service && service.expertId.toString() === expertId.toString()) {
        basePrice = service.price;
        // Optionally update service bookings count here or after payment
      }
    }

    const platformFee = Math.round(basePrice * 0.02);
    const amount = basePrice + platformFee;

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
      durationInMinutes: duration || 45,
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

module.exports = router;
