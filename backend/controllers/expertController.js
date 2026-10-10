const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const Message = require('../models/Message');

// GET /api/expert/profile
exports.getMyExpertProfile = async (req, res) => {
  try {
    const expert = await Expert.findById(req.user._id)
      .select('-password')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

    if (!expert) return res.status(404).json({ message: 'Expert not found' });
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
    const allowed = [
      'name', 'mobile', 'profileImage',
      'categoryId', 'subCategoryId',
      'specialty', 'qualification', 'specialization',
      'experience', 'bio', 'languages',
      'rates', 'onlineStatus', 'availability'
    ];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const expert = await Expert.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

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

    const history = completedConsultations.map(c => ({
      _id: c._id,
      createdAt: c.endTime || c.startTime || new Date(),
      type: 'EARNING',
      description: `Consultation with ${c.user ? c.user.name : 'Client'}`,
      amount: c.expertEarning || (c.cost * 0.8) || 0,
      status: 'COMPLETED'
    }));

    const totalEarnings = history.reduce((sum, item) => sum + item.amount, 0);

    // Mock available payout for now
    const availablePayout = totalEarnings;

    res.json({
      totalEarnings,
      availablePayout,
      history
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/expert/payouts/request
exports.requestPayout = async (req, res) => {
  try {
    // In a real app, you would create a Payout model entry
    res.json({ message: 'Payout requested successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
