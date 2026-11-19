const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const Message = require('../models/Message');
const PayoutTransaction = require('../models/PayoutTransaction');
const Setting = require('../models/Setting');
const crypto = require('crypto');
const accountService = require('../services/RazorpayAccountService');

// GET /api/expert/profile
exports.getMyExpertProfile = async (req, res) => {
  try {
    const expert = await Expert.findById(req.user._id)
      .select('-password')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    // Check if temporary suspension has expired
    if (
      expert.status === 'SUSPENDED' &&
      expert.suspensionDetails?.type === 'TEMPORARY' &&
      expert.suspensionDetails?.suspendedUntil &&
      new Date(expert.suspensionDetails.suspendedUntil) <= new Date()
    ) {
      expert.status = 'ACTIVE';
      if (expert.suspensionDetails) {
        expert.suspensionDetails.isSuspended = false;
        expert.suspensionDetails.type = 'NONE';
      }
      await expert.save();
    }

    res.json(expert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/expert/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const expertId = req.user._id;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const scheduledConsultationsCount = await Consultation.countDocuments({
      expert: expertId,
      status: 'scheduled'
    });

    const upcomingConsultationsCount = await Consultation.countDocuments({
      expert: expertId,
      status: 'scheduled',
      startTime: { $gte: new Date() }
    });

    const completedConsultations = await Consultation.find({
      expert: expertId,
      status: 'completed',
      paymentStatus: 'paid'
    });

    const totalEarnings = completedConsultations.reduce((sum, current) => sum + (current.expertEarning || current.cost || 0), 0);

    let unreadMessagesCount = 0;
    try {
       unreadMessagesCount = await Message.countDocuments({
         receiverId: expertId,
         isRead: false
       });
    } catch(err) {
       console.log('Message schema error, ignoring unread count');
    }

    res.json({
      scheduledConsultations: scheduledConsultationsCount,
      upcomingConsultations: upcomingConsultationsCount,
      totalEarnings,
      unreadMessages: unreadMessagesCount
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/expert/profile
exports.updateMyExpertProfile = async (req, res) => {
  try {
    // Validate profileImage size (strictly max 1MB)
    if (req.body.profileImage && typeof req.body.profileImage === 'string') {
      const approxBytes = Math.round((req.body.profileImage.length * 3) / 4);
      if (approxBytes > 1.2 * 1024 * 1024) {
        return res.status(400).json({ message: 'Profile photo size exceeds maximum 1MB limit. Please upload a compressed image.' });
      }
    }

    const allowed = [
      'name', 'mobile', 'profileImage',
      'categoryId', 'subCategoryId',
      'specialty', 'qualification', 'specialization',
      'experience', 'bio', 'languages',
      'rates', 'onlineStatus', 'availability',
      'latitude', 'longitude', 'location', 'country'
    ];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Enforce platform minimum rates: Chat >= ₹5/min, Audio >= ₹10/min, Video >= ₹20/min
    if (req.body.rates !== undefined) {
      const chatRate = Number(req.body.rates.chat);
      const audioRate = Number(req.body.rates.audio);
      const videoRate = Number(req.body.rates.video);

      if (isNaN(chatRate) || chatRate < 5) {
        return res.status(400).json({ 
          message: 'Minimum rate for Chat is ₹5 per minute. You cannot set a rate lower than ₹5/min.' 
        });
      }
      if (isNaN(audioRate) || audioRate < 10) {
        return res.status(400).json({ 
          message: 'Minimum rate for Audio call is ₹10 per minute. You cannot set a rate lower than ₹10/min.' 
        });
      }
      if (isNaN(videoRate) || videoRate < 20) {
        return res.status(400).json({ 
          message: 'Minimum rate for Video call is ₹20 per minute. You cannot set a rate lower than ₹20/min.' 
        });
      }

      updates.rates = {
        chat: chatRate,
        audio: audioRate,
        video: videoRate
      };
      updates.pricePerMinute = chatRate;
    }

    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      const latNum = Number(updates.latitude);
      const lngNum = Number(updates.longitude);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        updates.latitude = latNum;
        updates.longitude = lngNum;
        if (!updates.location) {
          updates.location = {
            type: 'Point',
            coordinates: [lngNum, latNum],
            country: updates.country || 'India'
          };
        } else if (Array.isArray(updates.location.coordinates)) {
          updates.location.coordinates = [lngNum, latNum];
        }
      }
    }

    const existingExpert = await Expert.findById(req.user._id);
    if (!existingExpert) return res.status(404).json({ message: 'Expert not found' });

    if (existingExpert.status === 'SUSPENDED') {
      if (
        existingExpert.suspensionDetails?.type === 'TEMPORARY' &&
        existingExpert.suspensionDetails?.suspendedUntil &&
        new Date(existingExpert.suspensionDetails.suspendedUntil) <= new Date()
      ) {
        existingExpert.status = 'ACTIVE';
        if (existingExpert.suspensionDetails) {
          existingExpert.suspensionDetails.isSuspended = false;
          existingExpert.suspensionDetails.type = 'NONE';
        }
        await existingExpert.save();
      } else if (updates.onlineStatus === 'online') {
        return res.status(403).json({
          message: `Your account is temporarily suspended. You cannot go online during the restriction period. Reason: ${existingExpert.suspensionDetails?.reason || 'Disciplinary Action'}.`,
          code: 'EXPERT_SUSPENDED'
        });
      }
    }

    const expert = await Expert.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

    if (updates.onlineStatus !== undefined) {
      const io = req.app.get('io');
      if (io) {
        io.emit('expert_status_changed', { expertId: expert._id.toString(), onlineStatus: expert.onlineStatus });
      }
    }

    res.json({ message: 'Profile updated successfully', expert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/expert/resubmit
exports.resubmitVerification = async (req, res) => {
  try {
    const expert = await Expert.findById(req.user._id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    if (expert.verificationStatus !== 'REJECTED') {
      return res.status(400).json({ message: 'You can only resubmit when your profile is rejected' });
    }

    expert.verificationStatus = 'PENDING';
    expert.rejectionReason = undefined;
    expert.rejectedAt = undefined;
    expert.rejectedBy = undefined;
    await expert.save();

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: 'Expert Re-approval Request',
      message: `Expert ${expert.name} updated profile details & documents and requested re-approval.`,
      actionText: 'Review application',
      link: '/expert-applications',
      type: 'expert_reapproval',
      badge: 'Re-approval'
    }, io).catch(e => console.error(e));

    res.json({ message: 'Profile submitted for review', verificationStatus: expert.verificationStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/expert/consultations
exports.getConsultations = async (req, res) => {
  try {
    const expertId = req.user._id;
    // status can be passed as a query param, otherwise fetch all
    const { status } = req.query; 

    let query = { expert: expertId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const consultations = await Consultation.find(query)
      .populate('user', 'name email profileImage')
      .sort({ startTime: -1 });

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/expert/consultations/:id/status
exports.updateConsultationStatus = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const consultation = await Consultation.findOneAndUpdate(
      { _id: id, expert: expertId },
      { status },
      { new: true }
    ).populate('user', 'name email profileImage');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/expert/earnings
exports.getEarnings = async (req, res) => {
  try {
    const expertId = req.user._id;
    
    // Fetch completed consultations for earnings
    const completedConsultations = await Consultation.find({
      expert: expertId,
      status: 'completed'
    }).populate('user', 'name').sort({ endTime: -1, startTime: -1 });

    const history = completedConsultations.map(c => {
      const isFree = Boolean(c.isFree);
      const grossCost = isFree ? 0 : Number(c.cost || 0);
      const commissionRate = c.commissionRate || 20;
      const platformFee = isFree ? 0 : Number(c.platformFee !== undefined ? c.platformFee : Math.round(grossCost * (commissionRate / 100)));
      const earningAmount = isFree ? 0 : Number(c.expertEarning !== undefined ? c.expertEarning : (grossCost - platformFee));
      return {
        _id: c._id,
        createdAt: c.endTime || c.startTime || new Date(),
        type: isFree ? 'FREE_PROMO' : 'EARNING',
        isFree,
        grossCost,
        platformFee,
        commissionRate,
        description: isFree 
          ? `🎁 Free Consultation with ${c.user ? c.user.name : 'Client'} (Promo)` 
          : `Consultation with ${c.user ? c.user.name : 'Client'} (Gross: ₹${grossCost} | Fee/Tax: -₹${platformFee})`,
        amount: earningAmount,
        status: 'COMPLETED'
      };
    });

    const totalEarnings = history.reduce((sum, item) => sum + item.amount, 0);
    const totalGross = history.reduce((sum, item) => sum + (item.grossCost || item.amount), 0);
    const totalPlatformFee = history.reduce((sum, item) => sum + (item.platformFee || 0), 0);

    // Compute payouts already requested or processed
    const existingPayouts = await PayoutTransaction.find({
      expert: expertId,
      status: { $in: ['PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
    });
    const totalWithdrawnOrPending = existingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availablePayout = Math.max(0, Number((totalEarnings - totalWithdrawnOrPending).toFixed(2)));

    const globalSetting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const minPayoutAmount = (globalSetting && typeof globalSetting.minPayoutAmount === 'number' && globalSetting.minPayoutAmount > 0)
      ? Number(globalSetting.minPayoutAmount)
      : 100;

    const payoutDaysInterval = Number(globalSetting?.payoutDaysInterval ?? 7);
    const payoutEstimatedDays = Number(globalSetting?.payoutEstimatedDays ?? 3);

    // Check latest payout for interval calculation
    const latestPayout = await PayoutTransaction.findOne({
      expert: expertId,
      status: { $in: ['PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
    }).sort({ createdAt: -1 });

    let canRequestPayout = true;
    let daysRemaining = 0;
    let nextEligiblePayoutDate = null;

    if (payoutDaysInterval > 0 && latestPayout && latestPayout.createdAt) {
      const msDiff = Date.now() - new Date(latestPayout.createdAt).getTime();
      const daysSince = msDiff / (1000 * 60 * 60 * 24);
      if (daysSince < payoutDaysInterval) {
        canRequestPayout = false;
        daysRemaining = Math.max(1, Math.ceil(payoutDaysInterval - daysSince));
        nextEligiblePayoutDate = new Date(new Date(latestPayout.createdAt).getTime() + payoutDaysInterval * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const activePayout = await PayoutTransaction.findOne({
      expert: expertId,
      status: { $in: ['VERIFICATION_PENDING', 'PENDING', 'QUEUED', 'PROCESSING'] }
    }).sort({ createdAt: -1 });

    res.json({
      totalEarnings,
      totalGross,
      totalPlatformFee,
      availablePayout,
      minPayoutAmount,
      activePayout,
      totalWithdrawn: totalWithdrawnOrPending,
      payoutDaysInterval,
      payoutEstimatedDays,
      canRequestPayout,
      daysRemaining,
      nextEligiblePayoutDate,
      lastPayoutDate: latestPayout?.createdAt || null,
      history
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/expert/payouts/request
exports.requestPayout = async (req, res) => {
  try {
    const expert = await Expert.findById(req.user._id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    if (!expert.bankDetails || expert.bankDetails.verificationStatus !== 'APPROVED') {
      const status = expert.bankDetails?.verificationStatus || 'NOT_SUBMITTED';
      let message = 'Bank details must be verified and approved by the Administrator before requesting a payout.';
      if (status === 'PENDING') {
        message = 'Your bank details are currently pending verification by the Administrator. Payout will be enabled once approved.';
      } else if (status === 'REJECTED') {
        message = `Your bank details were rejected: "${expert.bankDetails?.rejectionReason || 'Invalid documents'}". Please update your bank details in Settings.`;
      }
      return res.status(400).json({
        message,
        code: 'BANK_NOT_VERIFIED',
        bankVerificationStatus: status
      });
    }

    const holderName = (expert.bankDetails.accountName || expert.bankDetails.accountHolderName || expert.name || '').trim();

    if (!expert.bankDetails.accountNumber || !expert.bankDetails.ifscCode || !holderName) {
      return res.status(400).json({
        message: 'Bank details are incomplete. Please verify account number, IFSC code, and account holder name.'
      });
    }

    // Check existing pending payout request to avoid duplicate concurrent pending requests
    const activePending = await PayoutTransaction.findOne({
      expert: expert._id,
      status: { $in: ['PENDING', 'QUEUED', 'PROCESSING'] }
    });
    if (activePending) {
      return res.status(400).json({
        message: `You already have an active pending payout request of ₹${activePending.amount} (Ref: ${activePending.internalTransactionId}). Please wait for it to be processed.`
      });
    }

    // Compute available balance
    const completedConsultations = await Consultation.find({
      expert: expert._id,
      status: 'completed'
    });
    const totalEarnings = completedConsultations.reduce((sum, c) => {
      if (c.isFree) return sum;
      return sum + Number(c.expertEarning !== undefined ? c.expertEarning : (c.cost * 0.8) || 0);
    }, 0);

    const existingPayouts = await PayoutTransaction.find({
      expert: expert._id,
      status: { $in: ['PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
    });

    const totalWithdrawnOrPending = existingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const availablePayout = Math.max(0, Math.floor(totalEarnings - totalWithdrawnOrPending));

    const globalSetting = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const minPayoutAmount = (globalSetting && typeof globalSetting.minPayoutAmount === 'number' && globalSetting.minPayoutAmount > 0)
      ? Number(globalSetting.minPayoutAmount)
      : 100;

    if (availablePayout < minPayoutAmount) {
      return res.status(400).json({
        message: `Minimum payout request amount is ₹${minPayoutAmount}. Current available balance is ₹${availablePayout}.`,
        minPayoutAmount,
        availablePayout
      });
    }

    // Check dynamic payout interval configured by Admin
    const payoutDaysInterval = Number(globalSetting?.payoutDaysInterval ?? 7);
    if (payoutDaysInterval > 0) {
      const latestPayout = await PayoutTransaction.findOne({
        expert: expert._id,
        status: { $in: ['PENDING', 'QUEUED', 'PROCESSING', 'PROCESSED'] }
      }).sort({ createdAt: -1 });

      if (latestPayout && latestPayout.createdAt) {
        const msDiff = Date.now() - new Date(latestPayout.createdAt).getTime();
        const daysSince = msDiff / (1000 * 60 * 60 * 24);
        if (daysSince < payoutDaysInterval) {
          const daysLeft = Math.max(1, Math.ceil(payoutDaysInterval - daysSince));
          const nextDate = new Date(new Date(latestPayout.createdAt).getTime() + payoutDaysInterval * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          return res.status(400).json({
            message: `Payout restriction: You can request a payout once every ${payoutDaysInterval} days. Next eligible payout date: ${nextDate} (${daysLeft} day(s) remaining).`,
            code: 'PAYOUT_INTERVAL_RESTRICTION',
            payoutDaysInterval,
            daysLeft,
            nextEligibleDate: nextDate
          });
        }
      }
    }

    const defaultPayoutAccount = globalSetting?.defaultPayoutAccount || 'RAZORPAY_1';

    const internalTransactionId = `PAYOUT_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const idempotencyKey = `IDEMP_${expert._id}_${availablePayout}_${Date.now()}`;

    // Create PayoutTransaction record in database
    const payoutRecord = new PayoutTransaction({
      expert: expert._id,
      amount: availablePayout,
      currency: 'INR',
      accountCode: defaultPayoutAccount,
      status: 'PENDING',
      internalTransactionId,
      idempotencyKey,
      bankDetails: {
        accountHolderName: holderName,
        accountNumber: expert.bankDetails.accountNumber,
        ifscCode: expert.bankDetails.ifscCode,
        bankName: expert.bankDetails.bankName,
        upiId: expert.bankDetails.upiId
      },
      notes: {
        requestedVia: 'expert_dashboard',
        expertName: expert.name
      }
    });

    await payoutRecord.save();

    // Dispatch real-time notification to Administrator
    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: 'Expert Payout Request',
      message: `${expert.name || 'Expert'} has requested a payout of ₹${availablePayout} to bank account ending with ****${expert.bankDetails.accountNumber.slice(-4)}.`,
      actionText: 'Review & Approve Payout',
      link: '/razorpay-accounts',
      type: 'payout_request',
      badge: 'Payout'
    }, io).catch(e => console.error(e));

    res.json({
      success: true,
      message: `Payout request of ₹${availablePayout} submitted successfully!`,
      payoutId: payoutRecord.internalTransactionId,
      amount: availablePayout
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/expert/payouts/confirm-penny-drop
exports.confirmPennyDrop = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { payoutId } = req.body;

    const payout = await PayoutTransaction.findOne({
      _id: payoutId,
      expert: expertId,
      status: 'VERIFICATION_PENDING'
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Active ₹1 verification request not found for this payout.'
      });
    }

    payout.pennyDropConfirmed = true;
    payout.pennyDropConfirmedAt = new Date();
    payout.status = 'PENDING'; // Ready for remaining balance payout processing
    await payout.save();

    const io = req.app.get('io');
    const { sendNotification } = require('../utils/notificationDispatcher');

    // Notify Administrator
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: '₹1 Verification Confirmed by Expert',
      message: `${payout.bankDetails?.accountHolderName || 'Expert'} has confirmed receipt of ₹1. Remaining balance of ₹${payout.remainingAmount} is now approved for payout.`,
      actionText: 'Disburse Payout',
      link: '/razorpay-accounts',
      type: 'payout_request',
      badge: 'Verified'
    }, io).catch(e => console.error(e));

    // Notify Expert
    sendNotification({
      recipient: expertId,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: '₹1 Received Confirmed!',
      message: `Verification confirm ho gayi hai! Baki bacha amount ₹${payout.remainingAmount} (1 rupya deduct karke) process kiya ja raha hai.`,
      actionText: 'View Earnings',
      link: '/expert/earnings',
      type: 'payout_processed',
      badge: 'Processing'
    }, io).catch(e => console.error(e));

    res.json({
      success: true,
      message: `Verification successful! ₹1 confirm hone ke baad remaining ₹${payout.remainingAmount} payout ke liye schedule ho gaya hai.`,
      payout
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm verification', error: error.message });
  }
};

// POST /api/expert/payouts/cancel
exports.cancelPayout = async (req, res) => {
  try {
    const expertId = req.user._id;
    const { payoutId } = req.body;

    const payout = await PayoutTransaction.findOne({
      _id: payoutId,
      expert: expertId,
      status: 'VERIFICATION_PENDING'
    });

    if (!payout) {
      return res.status(404).json({ success: false, message: 'Active pending verification payout not found.' });
    }

    payout.status = 'CANCELLED';
    payout.failureReason = 'Cancelled by expert prior to verification';
    await payout.save();

    res.json({ success: true, message: 'Payout request cancelled. Balance restored to your earnings.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel payout', error: error.message });
  }
};
