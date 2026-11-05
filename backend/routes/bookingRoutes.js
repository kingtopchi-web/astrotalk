const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');

const ExpertService = require('../models/ExpertService');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { checkFreeChatEligibility } = require('../utils/freeChatHelper');

// @route   GET /api/bookings/free-chat-status
// @desc    Get free chat settings and user eligibility
// @access  Public (detects auth token if provided)
router.get('/free-chat-status', async (req, res) => {
  try {
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const enableFreeChat = settings ? settings.enableFreeChat !== false : true;
    const freeChatDurationMinutes = settings?.freeChatDurationMinutes || 5;

    let hasUsedFreeChat = false;
    let hasUsedToday = false;
    let usedExpertIds = [];
    let isEligibleForExpert = true;
    let hasUsedWithExpert = false;
    let reason = null;
    let message = null;
    let userId = null;

    const expertId = req.query.expertId || null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          userId = user._id;
          const eligibility = await checkFreeChatEligibility(user._id, expertId);
          hasUsedToday = eligibility.hasUsedToday;
          usedExpertIds = eligibility.usedExpertIds;
          hasUsedWithExpert = eligibility.hasUsedWithExpert;
          isEligibleForExpert = eligibility.isEligible;
          reason = eligibility.reason;
          message = eligibility.message;
          // hasUsedFreeChat reflects whether user is blocked right now (either today or with queried expert)
          hasUsedFreeChat = expertId ? (!eligibility.isEligible) : eligibility.hasUsedToday;
        }
      } catch (e) {}
    }

    res.json({
      enableFreeChat,
      freeChatDurationMinutes,
      hasUsedFreeChat,
      hasUsedToday,
      usedExpertIds,
      hasUsedWithExpert,
      isEligibleForExpert,
      reason,
      message,
      userId
    });
  } catch (error) {
    console.error('Free chat status error:', error);
    res.status(500).json({ message: 'Error checking free chat status' });
  }
});

// @route   POST /api/bookings/start-free-call & /api/bookings/start-free-chat
// @desc    Start one-time free consultation (audio call by default)
// @access  Private (USER only)
const handleStartFreeConsultation = async (req, res) => {
  try {
    const { expertId } = req.body;
    if (!expertId) {
      return res.status(400).json({ message: 'Expert ID is required to start free consultation' });
    }

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }
    if (expert.verificationStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'This expert is not verified for consultations yet.', code: 'EXPERT_NOT_VERIFIED' });
    }

    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    if (settings && settings.enableFreeChat === false) {
      return res.status(400).json({ message: 'Free consultation is currently disabled by administrator.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify 1-per-day and 1-per-expert eligibility
    const eligibility = await checkFreeChatEligibility(req.user._id, expertId);
    if (!eligibility.isEligible) {
      return res.status(400).json({ 
        message: eligibility.message,
        reason: eligibility.reason,
        hasUsedToday: eligibility.hasUsedToday,
        hasUsedWithExpert: eligibility.hasUsedWithExpert,
        hasUsedFreeChat: true 
      });
    }

    const durationMinutes = settings?.freeChatDurationMinutes || 5;

    // Track free consultation usage on user document
    user.hasUsedFreeChat = true;
    user.lastFreeChatAt = new Date();
    if (!user.freeChatUsedExperts) user.freeChatUsedExperts = [];
    if (!user.freeChatUsedExperts.some(id => id.toString() === expertId.toString())) {
      user.freeChatUsedExperts.push(expertId);
    }
    await user.save();

    // Default to 'call' (audio call) unless explicitly specified
    const requestedType = (req.body.type || 'call').toLowerCase();
    const sessionType = (requestedType === 'chat') ? 'chat' : 'call';

    // Create Free Consultation with isFree: true, zero cost, zero expert earning
    const consultation = new Consultation({
      user: req.user._id,
      expert: expertId,
      startTime: new Date(),
      durationInMinutes: durationMinutes,
      status: 'ongoing',
      paymentStatus: 'paid',
      type: sessionType,
      cost: 0,
      expertEarning: 0,
      platformFee: 0,
      isFree: true,
      freeChatDurationMinutes: durationMinutes,
      chatStarted: sessionType === 'chat' ? false : true
    });
    consultation.meetingLink = sessionType === 'chat' ? `/messages` : `/live/${consultation._id}?type=audio`;
    await consultation.save();

    // Ensure conversation exists
    let conversationId = null;
    const Conversation = require('../models/Conversation');
    let conversation = await Conversation.findOne({
      participants: { 
        $all: [
          { $elemMatch: { participantId: req.user._id, participantModel: 'User' } },
          { $elemMatch: { participantId: expert._id, participantModel: 'Expert' } }
        ]
      }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [
          { participantId: req.user._id, participantModel: 'User' },
          { participantId: expert._id, participantModel: 'Expert' }
        ]
      });
      await conversation.save();
    }
    conversationId = conversation._id;

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    if (io) {
      const isCall = sessionType === 'call' || sessionType === 'audio' || sessionType === 'video';
      const callType = sessionType === 'video' ? 'video' : 'audio';

      if (isCall) {
        io.to(`user_${expert._id}`).emit('VIDEO_USER_WAITING', {
          consultationId: consultation._id,
          type: callType,
          userId: req.user._id,
          userName: req.user.name || 'Client',
          expertId: expert._id,
          serviceName: 'Free Audio Consultation'
        });
      } else {
        io.to(`user_${req.user._id}`).emit('new_chat_consultation', {
          consultationId: consultation._id,
          type: 'chat',
          partnerId: expert._id,
          partnerModel: 'Expert',
          consultation,
          conversationId
        });
        io.to(`user_${expert._id}`).emit('new_chat_consultation', {
          consultationId: consultation._id,
          type: 'chat',
          partnerId: req.user._id,
          partnerModel: 'User',
          userName: req.user.name || 'Client',
          consultation,
          conversationId
        });
      }
    }

    const isAudioCall = sessionType === 'call';

    sendNotification({
      recipient: req.user._id,
      recipientRole: 'USER',
      recipientModel: 'User',
      title: isAudioCall ? 'Free Audio Call Started 🎁' : 'Free Consultation Started 🎁',
      message: isAudioCall
        ? `Your ${durationMinutes}-minute free audio consultation with ${expert.name} is connecting!`
        : `Your ${durationMinutes}-minute free consultation with ${expert.name} is now live!`,
      actionText: isAudioCall ? 'Join Audio Call' : 'Open Chat',
      link: isAudioCall ? `/live/${consultation._id}?type=audio` : '/messages',
      type: 'booking_confirmed',
      badge: 'Free'
    }, io).catch(() => {});

    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: isAudioCall ? 'New Free Audio Call' : 'New Free Consultation Session',
      message: `${user.name || 'A client'} started a ${durationMinutes}-minute free ${isAudioCall ? 'audio' : 'chat'} consultation. Please answer promptly!`,
      actionText: isAudioCall ? 'Answer Audio Call' : 'Open Chat & Reply',
      link: isAudioCall ? `/live/${consultation._id}?type=audio` : '/expert/messages',
      type: 'consultation_request',
      badge: 'Free'
    }, io).catch(() => {});

    return res.status(201).json({
      message: 'Free consultation started',
      consultation,
      conversationId,
      durationMinutes
    });
  } catch (error) {
    console.error('Start free consultation error:', error);
    return res.status(500).json({ message: 'Failed to start free consultation', error: error.message });
  }
};

router.post('/start-free-call', protect, authorizeRoles('USER'), handleStartFreeConsultation);
router.post('/start-free-chat', protect, authorizeRoles('USER'), handleStartFreeConsultation);

// @route   POST /api/bookings
// @desc    Create a new booking (consultation)
// @access  Private (USER only)
router.post('/', protect, authorizeRoles('USER'), async (req, res) => {
  try {
    const { expertId, serviceId, date, time, type, duration, notes, isFree } = req.body;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }
    if (expert.verificationStatus !== 'APPROVED') {
      return res.status(400).json({ message: 'This expert is not verified for consultations yet.', code: 'EXPERT_NOT_VERIFIED' });
    }

    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    let consultationDuration = duration || 45;
    let basePrice = 0;
    let platformFee = 0;
    let amount = 0;
    let commission = null;

    // Convert 'Video'/'Audio'/'Chat' to match schema ('video', 'call', 'chat')
    let schemaType = 'call';
    const lowerType = (type || '').toLowerCase();
    if (lowerType === 'video') schemaType = 'video';
    else if (lowerType === 'chat') schemaType = 'chat';
    else schemaType = 'call';

    const isFreeBooking = Boolean(isFree);

    if (isFreeBooking) {
      if (settings && settings.enableFreeChat === false) {
        return res.status(400).json({ message: 'Free chat consultation is currently disabled by administrator.' });
      }

      // Verify 1-per-day and 1-per-expert eligibility
      const eligibility = await checkFreeChatEligibility(req.user._id, expertId);
      if (!eligibility.isEligible) {
        return res.status(400).json({ 
          message: eligibility.message,
          reason: eligibility.reason,
          hasUsedToday: eligibility.hasUsedToday,
          hasUsedWithExpert: eligibility.hasUsedWithExpert,
          hasUsedFreeChat: true
        });
      }

      consultationDuration = settings?.freeChatDurationMinutes || 5;
      basePrice = 0;
      platformFee = 0;
      amount = 0;

      // Track free chat usage on user document
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { freeChatUsedExperts: expertId },
        lastFreeChatAt: new Date(),
        hasUsedFreeChat: true
      });
    } else {
      const lowerSessionType = type.toLowerCase();
      let ratePerMinute = 20;
      if (lowerSessionType === 'chat') {
        ratePerMinute = Math.max(5, expert.rates?.chat || expert.pricePerMinute || 5);
      } else if (lowerSessionType === 'audio' || lowerSessionType === 'call') {
        ratePerMinute = Math.max(10, expert.rates?.audio || expert.pricePerMinute || 10);
      } else if (lowerSessionType === 'video') {
        ratePerMinute = Math.max(20, expert.rates?.video || expert.pricePerMinute || 20);
      } else {
        ratePerMinute = Math.max(10, expert.rates?.[lowerSessionType] || expert.pricePerMinute || 10);
      }
      basePrice = ratePerMinute * consultationDuration;
      
      // If booked via a specific service, use the service price as total price
      if (serviceId) {
        const service = await ExpertService.findById(serviceId);
        if (service && service.expertId.toString() === expertId.toString()) {
          basePrice = service.price;
        }
      }

      const { getEffectiveCommission } = require('../utils/commissionHelper');
      commission = await getEffectiveCommission({ expertId, expert, serviceId });
      const commissionRate = commission.rate;
      platformFee = Number((basePrice * commissionRate).toFixed(2));
      const expertEarning = Number((basePrice - platformFee).toFixed(2));
      amount = Number(basePrice.toFixed(2));

      // Check if user has at least 1 minute minimum balance in wallet to connect (PAID bookings only)
      const user = await User.findById(req.user._id);
      const minRequired = ratePerMinute;
      if (!user || (user.walletBalance || 0) < minRequired) {
        return res.status(400).json({ 
          message: `Insufficient balance. Minimum ₹${minRequired} (1 minute) required in your wallet to start.`,
          requiredBalance: minRequired,
          currentBalance: user ? (user.walletBalance || 0) : 0
        });
      }
    }

    // Parse date and time properly
    const startTime = date ? new Date(date) : new Date();

    const allowInstant = settings ? settings.enableInstantBooking !== false : true;
    if (req.body.isInstant && !allowInstant && !isFreeBooking) {
      return res.status(400).json({ 
        message: 'Instant booking is currently disabled by administrator. Please schedule an appointment slot.' 
      });
    }

    const isInstant = (req.body.isInstant !== undefined ? req.body.isInstant : !serviceId) && allowInstant;
    const initialStatus = (isInstant || isFreeBooking) ? 'ongoing' : 'pending';

    const consultation = new Consultation({
      user: req.user._id,
      expert: expertId,
      service: serviceId || null,
      startTime: startTime,
      durationInMinutes: consultationDuration,
      status: initialStatus, 
      paymentStatus: isFreeBooking ? 'paid' : 'pending',
      type: schemaType,
      cost: amount,
      expertEarning: isFreeBooking ? 0 : expertEarning,
      platformFee: platformFee,
      commissionRate: isFreeBooking ? 0 : (commission ? commission.percentage : 20),
      category: isFreeBooking ? (expert?.categoryId || null) : (commission?.categoryId || expert?.categoryId || null),
      isFree: isFreeBooking,
      freeChatDurationMinutes: isFreeBooking ? consultationDuration : null
    });
    
    // Set meeting link dynamically pointing to our WebRTC live session route
    consultation.meetingLink = `/live/${consultation._id}?type=${schemaType === 'video' ? 'video' : 'audio'}`;

    await consultation.save();

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    // Emit live socket event to both user and expert so their chat UI auto-refreshes instantly!
    if (io) {
      const isCall = schemaType === 'call' || schemaType === 'audio' || schemaType === 'video';
      const callType = schemaType === 'video' ? 'video' : 'audio';

      if (isCall) {
        io.to(`user_${expert._id}`).emit('VIDEO_USER_WAITING', {
          consultationId: consultation._id,
          type: callType,
          userId: req.user._id,
          userName: req.user.name || 'Client',
          expertId: expert._id,
          serviceName: `${callType === 'video' ? 'Video' : 'Audio'} Consultation`
        });
      } else {
        io.to(`user_${req.user._id}`).emit('new_chat_consultation', {
          consultationId: consultation._id,
          type: 'chat',
          partnerId: expert._id,
          partnerModel: 'Expert',
          consultation
        });
        io.to(`user_${expert._id}`).emit('new_chat_consultation', {
          consultationId: consultation._id,
          type: 'chat',
          partnerId: req.user._id,
          partnerModel: 'User',
          userName: req.user.name || 'Client',
          consultation
        });
      }
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
      .populate('user', 'name profileImage role phone email')
      .populate('expert', 'name profileImage specialty specialization role phone email rates pricePerMinute');
      
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

    const consultation = await Consultation.findOne(query).sort({ startTime: -1 });
    if (!consultation) {
      return res.status(404).json({ message: 'No active chat consultation found' });
    }

    // If chat has not officially started, check if expert has already sent a reply!
    if (consultation && !consultation.chatStarted) {
      try {
        const Message = require('../models/Message');
        const Conversation = require('../models/Conversation');
        const conv = await Conversation.findOne({
          participants: {
            $all: [
              { $elemMatch: { participantId: consultation.user } },
              { $elemMatch: { participantId: consultation.expert } }
            ]
          }
        });
        if (conv) {
          const expertMsg = await Message.findOne({
            conversationId: conv._id,
            $or: [
              { senderModel: 'Expert' },
              { sender: consultation.expert },
              { sender: { $ne: consultation.user } }
            ],
            createdAt: { $gte: new Date(new Date(consultation.startTime).getTime() - 120000) }
          });
          if (expertMsg) {
            consultation.chatStarted = true;
            consultation.chatStartedAt = expertMsg.createdAt || new Date();
            consultation.status = 'ongoing';
            await consultation.save();
          }
        }
      } catch (e) {
        console.warn('Check expert message error:', e.message);
      }
    }

    res.json(consultation);
  } catch (error) {
    console.error('Fetch active chat error:', error);
    res.status(500).json({ message: 'Failed to fetch active chat consultation' });
  }
});

// @route   POST /api/bookings/:id/reject
// @desc    Expert rejects/declines an incoming consultation (call or chat)
// @access  Private (EXPERT)
router.post('/:id/reject', protect, authorizeRoles('EXPERT'), async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).populate('user expert');
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (consultation.expert._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this consultation' });
    }

    if (consultation.status === 'completed' || consultation.status === 'cancelled') {
      return res.status(200).json({ message: 'Consultation already finished or cancelled', consultation });
    }

    consultation.status = 'cancelled';
    await consultation.save();

    // Mark associated VideoSession cancelled if exists
    const VideoSession = require('../models/VideoSession');
    await VideoSession.updateMany(
      { consultationId: consultation._id },
      { $set: { status: 'CANCELLED', endedAt: new Date() } }
    ).catch(() => {});

    const io = req.app.get('io');
    if (io) {
      const reason = req.body.reason || 'Consultation declined by expert';
      io.to(`call_room_${consultation._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id, reason });
      io.to(`call_room_${consultation._id}`).emit('session_ended', { consultationId: consultation._id, reason });

      if (consultation.user?._id) {
        io.to(`user_${consultation.user._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id, reason });
        io.to(`user_${consultation.user._id}`).emit('chat_rejected', { consultationId: consultation._id, reason });
        io.to(`user_${consultation.user._id}`).emit('session_ended', { consultationId: consultation._id, reason });
      }
    }

    res.json({ message: 'Consultation rejected successfully', consultation });
  } catch (error) {
    console.error('Reject consultation error:', error);
    res.status(500).json({ message: 'Failed to reject consultation', error: error.message });
  }
});

// @route   POST /api/bookings/:id/end
// @desc    End a consultation and process pro-rata payment
// @access  Private (USER or EXPERT)
router.post('/:id/end', protect, async (req, res) => {
  try {
    // 0. Authorization check: Requester must be the user, expert, or admin
    const targetConsultation = await Consultation.findById(req.params.id);
    if (!targetConsultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const requesterId = req.user._id.toString();
    const isParticipant = 
      (targetConsultation.user && targetConsultation.user.toString() === requesterId) ||
      (targetConsultation.expert && targetConsultation.expert.toString() === requesterId) ||
      req.user.role === 'ADMIN';

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to end this consultation' });
    }

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

    let { actualDuration, durationSeconds } = req.body;

    // 1. Calculate exact total elapsed seconds
    let totalSeconds = 0;
    if (durationSeconds !== undefined && durationSeconds !== null && !isNaN(Number(durationSeconds))) {
      totalSeconds = Math.max(0, Number(durationSeconds));
    } else if (actualDuration) {
      totalSeconds = Math.max(0, Math.round(Number(actualDuration) * 60));
    }

    // Server-side bounds check: never allow client-manipulated duration to exceed elapsed time
    let maxAllowedMinutes = consultation.durationInMinutes || 60;
    const VideoSession = require('../models/VideoSession');
    const videoSession = await VideoSession.findOne({ consultationId: consultation._id });
    const sessionStartTime = videoSession?.startedAt || consultation.chatStartedAt || consultation.startTime;
    if (sessionStartTime) {
      const elapsedMs = Date.now() - new Date(sessionStartTime).getTime();
      const elapsedMinutes = Math.max(0.01, elapsedMs / (60 * 1000));
      maxAllowedMinutes = Math.min(maxAllowedMinutes, Math.ceil(elapsedMinutes + 2)); // 2 min buffer
      const serverElapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));
      // Cap at server elapsed time + 30s buffer for network latency
      if (totalSeconds > serverElapsedSec + 30) {
        totalSeconds = serverElapsedSec;
      }
    }
    actualDuration = Math.min(Number((totalSeconds / 60).toFixed(2)) || 0.01, maxAllowedMinutes);

    const expert = consultation.expert;
    const user = consultation.user;

    // FREE CHAT CONSULTATION SPECIAL HANDLING:
    // No wallet debit to user (₹0 charged)
    // No wallet credit to expert (₹0 earning)
    if (consultation.isFree) {
      await Consultation.findByIdAndUpdate(consultation._id, {
        cost: 0,
        expertEarning: 0,
        platformFee: 0,
        durationInMinutes: actualDuration,
        paymentStatus: 'paid'
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`call_room_${consultation._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
        io.to(`call_room_${consultation._id}`).emit('session_ended', {
          consultationId: consultation._id,
          reason: req.body.reason || 'Free chat session ended'
        });

        if (user?._id) {
          io.to(`user_${user._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
          io.to(`user_${user._id}`).emit('session_ended', {
            consultationId: consultation._id,
            reason: req.body.reason || 'Free chat session ended'
          });
        }
        if (expert?._id) {
          io.to(`user_${expert._id}`).emit('VIDEO_SESSION_ENDED', { consultationId: consultation._id });
          io.to(`user_${expert._id}`).emit('session_ended', {
            consultationId: consultation._id,
            reason: req.body.reason || 'Free chat session ended'
          });
        }
      }

      const { sendNotification } = require('../utils/notificationDispatcher');

      sendNotification({
        recipient: user._id,
        recipientRole: 'USER',
        recipientModel: 'User',
        title: 'Free Consultation Ended',
        message: `Your free chat consultation with ${expert?.name || 'the expert'} has ended. You can book a paid session anytime!`,
        actionText: 'View experts',
        link: '/experts',
        type: 'rate_consultation',
        badge: 'Free'
      }, io).catch(() => {});

      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Free Session Completed',
        message: `Your free consultation session with ${user?.name || 'Client'} has completed.`,
        actionText: 'View consultations',
        link: '/expert/consultations',
        type: 'consultation_completed',
        badge: 'Free'
      }, io).catch(() => {});

      return res.json({ 
        message: 'Free consultation ended successfully. Zero charge to user, zero earning to expert.', 
        consultation: { ...consultation.toObject(), status: 'completed', cost: 0, expertEarning: 0 } 
      });
    }

    // 2-MINUTE THRESHOLD RULE:
    // If call/chat ends before 2 minutes (totalSeconds < 120s):
    // - Expert receives ₹0.
    // - User is charged ₹0 (or 100% full refund if pre-paid).
    // If call/chat runs for 2 minutes or more (totalSeconds >= 120s, e.g. 121s):
    // - User is billed for the ENTIRE duration including the initial 2 minutes!
    // - Expert receives full earnings for the ENTIRE duration including the initial 2 minutes!
    const isUnderTwoMinutes = totalSeconds < 120;

    const consultType = (consultation.type || 'video').toLowerCase();
    let ratePerMinute = 20;
    if (consultType === 'chat') {
      ratePerMinute = Math.max(5, expert?.rates?.chat || expert?.pricePerMinute || 5);
    } else if (consultType === 'audio' || consultType === 'call') {
      ratePerMinute = Math.max(10, expert?.rates?.audio || expert?.pricePerMinute || 10);
    } else if (consultType === 'video') {
      ratePerMinute = Math.max(20, expert?.rates?.video || expert?.pricePerMinute || 20);
    } else {
      ratePerMinute = Math.max(10, expert?.rates?.[consultType] || expert?.pricePerMinute || 10);
    }

    const { getEffectiveCommission } = require('../utils/commissionHelper');
    const commission = await getEffectiveCommission({
      categoryId: consultation.category,
      expertId: consultation.expert,
      expert
    });
    const commissionRate = commission.rate;

    let actualBasePrice = 0;
    let actualPlatformFee = 0;
    let actualTotalCost = 0;
    let finalEarning = 0;
    let finalPlatformFee = 0;
    const durationLabel = totalSeconds >= 60 
      ? `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s` 
      : `${totalSeconds}s`;

    if (!isUnderTwoMinutes) {
      // Per-second pro-rata billing: billed strictly according to exact elapsed seconds!
      // (e.g. 2 min 8 sec = 128s, NOT rounded up to 3 full minutes!)
      actualTotalCost = Number(((totalSeconds / 60) * ratePerMinute).toFixed(2));
      actualPlatformFee = Number((actualTotalCost * commissionRate).toFixed(2));
      actualBasePrice = Number((actualTotalCost - actualPlatformFee).toFixed(2));
      finalEarning = actualBasePrice;
      finalPlatformFee = actualPlatformFee;
    }

    // Check if this consultation was pre-paid upfront or Pay-As-You-Go (post-paid)
    if (consultation.paymentStatus === 'paid') {
      // PRE-PAID CASE: Money was already deducted upfront
      const originalCost = consultation.cost || 0;
      // If under 2 mins, refund 100% of original cost! Otherwise refund unused difference.
      const refundAmount = isUnderTwoMinutes
        ? originalCost
        : (originalCost > actualTotalCost ? Number((originalCost - actualTotalCost).toFixed(2)) : 0);

      const existingRefund = await WalletTransaction.findOne({
        consultation: consultation._id,
        type: 'REFUND'
      });

      if (refundAmount > 0 && !existingRefund) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $inc: { walletBalance: refundAmount } },
          { new: false }
        );
        const userBalanceBefore = updatedUser ? (updatedUser.walletBalance || 0) : 0;
        const userBalanceAfter = Number((userBalanceBefore + refundAmount).toFixed(2));

        const refundTx = new WalletTransaction({
          user: user._id,
          type: 'REFUND',
          amount: refundAmount,
          status: 'SUCCESS',
          balanceBefore: userBalanceBefore,
          balanceAfter: userBalanceAfter,
          description: isUnderTwoMinutes
            ? `Full refund: ${consultation.type} session ended under 2 minutes (${totalSeconds}s)`
            : `Refund for unused time in ${consultation.type} session`,
          consultation: consultation._id,
          completedAt: new Date()
        });
        await refundTx.save();
      }

      // Credit Expert ONLY if session ran 2+ minutes and has positive earnings
      if (!isUnderTwoMinutes && finalEarning > 0) {
        const existingCredit = await WalletTransaction.findOne({
          consultation: consultation._id,
          type: 'CREDIT'
        });

        if (!existingCredit) {
          const updatedExpert = await Expert.findOneAndUpdate(
            { _id: expert._id },
            { $inc: { walletBalance: finalEarning } },
            { new: false }
          );
          const expertBalanceBefore = updatedExpert ? (updatedExpert.walletBalance || 0) : 0;
          const expertBalanceAfter = Number((expertBalanceBefore + finalEarning).toFixed(2));

          const expertTx = new WalletTransaction({
            user: expert._id,
            type: 'CREDIT',
            amount: finalEarning,
            status: 'SUCCESS',
            balanceBefore: expertBalanceBefore,
            balanceAfter: expertBalanceAfter,
            description: `Earnings for ${durationLabel} ${consultation.type} session (including first 2 mins)`,
            consultation: consultation._id,
            completedAt: new Date()
          });
          await expertTx.save();
        }
      }
    } else {
      // PAY-AS-YOU-GO CASE: No upfront deduction occurred!
      if (!isUnderTwoMinutes && actualTotalCost > 0) {
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
            description: `Payment for ${durationLabel} ${consultation.type} session`,
            consultation: consultation._id,
            completedAt: new Date()
          });
          await debitTx.save();

          // Credit Expert
          const existingCredit = await WalletTransaction.findOne({
            consultation: consultation._id,
            type: 'CREDIT'
          });

          if (!existingCredit && finalEarning > 0) {
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
              description: `Earnings for ${durationLabel} ${consultation.type} session (including first 2 mins)`,
              consultation: consultation._id,
              completedAt: new Date()
            });
            await expertTx.save();
          }
        }
      }
    }

    // Finalize Consultation record
    await Consultation.findByIdAndUpdate(consultation._id, {
      cost: actualTotalCost,
      expertEarning: finalEarning,
      platformFee: finalPlatformFee,
      commissionRate: commission.percentage,
      category: commission.categoryId || consultation.category || expert.categoryId || null,
      durationInMinutes: actualDuration,
      paymentStatus: 'paid'
    });

    // Mark associated VideoSession as COMPLETED
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

    // Dynamic Notification to User: Rate Your Consultation (only if session ran 2+ min)
    if (!isUnderTwoMinutes) {
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
      }, io).catch(() => {});
    }

    if (isUnderTwoMinutes) {
      // Notification to User for < 2 min grace
      await sendNotification({
        recipient: user._id,
        recipientRole: 'USER',
        recipientModel: 'User',
        title: 'Session Ended (< 2 Min)',
        message: `Your ${consultation.type} session ended under 2 minutes (${totalSeconds}s). As per policy, ₹0 was charged.`,
        actionText: 'View wallet',
        link: '/wallet',
        type: 'wallet_update',
        badge: 'Free'
      }, io).catch(() => {});

      // Notification to Expert for < 2 min grace
      await sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Session Ended (< 2 Min)',
        message: `Your ${consultation.type} session with ${user.name || 'Client'} ended in under 2 minutes (${totalSeconds}s). Sessions under 2 minutes are not billed.`,
        actionText: 'View consultations',
        link: '/expert/consultations',
        type: 'consultation_completed',
        badge: 'Info'
      }, io).catch(() => {});
    } else {
      // Dynamic Notification to User: Wallet Debit / Update
      if (actualTotalCost > 0) {
        await sendNotification({
          recipient: user._id,
          recipientRole: 'USER',
          recipientModel: 'User',
          title: 'Wallet Deduction',
          message: `₹${actualTotalCost} was charged for your ${durationLabel} ${consultation.type} consultation with ${expert.name}. Updated balance: ₹${user.walletBalance}.`,
          actionText: 'View wallet',
          link: '/wallet',
          type: 'wallet_update',
          badge: 'Debit'
        }, io).catch(() => {});
      }

      // Dynamic Notification to Expert: Earnings Update
      await sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Earnings Update',
        message: `You earned ₹${finalEarning.toFixed(2)} for ${durationLabel} from your completed consultation with ${user.name || 'Client'}.`,
        actionText: 'View earnings',
        link: '/expert/earnings',
        type: 'earnings_update',
        badge: 'New'
      }, io).catch(() => {});
    }

    res.json({ message: 'Session ended successfully', consultation });
  } catch (error) {
    console.error('End session error:', error);
    try { require('fs').appendFileSync('error_log.txt', 'End session error: ' + error.stack + '\n'); } catch (e) {}
    res.status(500).json({ message: 'Failed to end session' });
  }
});

module.exports = router;
