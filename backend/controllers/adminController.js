const User = require('../models/User');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Admin = require('../models/Admin');
const Consultation = require('../models/Consultation');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const Setting = require('../models/Setting');
const ContactInquiry = require('../models/ContactInquiry');
const ExpertDocument = require('../models/ExpertDocument');
const { getRequirementsForCategory } = require('../utils/documentRequirementsHelper');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = await Setting.create({ singletonKey: 'GLOBAL_SETTINGS' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = await Setting.findOneAndUpdate(
      { singletonKey: 'GLOBAL_SETTINGS' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) query.status = req.query.status;

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('expert', 'name email')
      .populate('consultation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.json({
      data: payments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.type) query.type = req.query.type;

    const transactions = await WalletTransaction.find(query)
      .populate('user', 'name email role')
      .populate('consultation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      data: transactions,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const revenueStats = await Consultation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalConsultations: { $sum: 1 },
          totalRevenue: { $sum: "$cost" },
          totalPlatformFee: { $sum: "$platformFee" },
          totalExpertEarnings: { $sum: "$expertEarning" }
        }
      }
    ]);
    
    // Also get revenue grouped by month
    const monthlyRevenue = await Consultation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          platformFee: { $sum: "$platformFee" },
          totalRevenue: { $sum: "$cost" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get recent consultations for details table
    const recentConsultations = await Consultation.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: revenueStats.length > 0 ? revenueStats[0] : { totalConsultations: 0, totalRevenue: 0, totalPlatformFee: 0, totalExpertEarnings: 0 },
      monthly: monthlyRevenue,
      recentConsultations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revenue', error: error.message });
  }
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch summary counts in parallel
    const summaryPromise = Promise.all([
      User.countDocuments(),
      Expert.countDocuments(),
      Expert.countDocuments({ verificationStatus: 'PENDING' }),
      Expert.countDocuments({ verificationStatus: 'APPROVED' }),
      Expert.countDocuments({ verificationStatus: 'REJECTED' }),
      Expert.countDocuments({ status: 'ACTIVE' }),
      Expert.countDocuments({ status: 'SUSPENDED' }),
      Category.countDocuments(),
      SubCategory.countDocuments()
    ]);

    // 2. Build last 7 days parallel promises
    const daysPromises = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      daysPromises.push(
        Promise.all([
          User.countDocuments({ createdAt: { $gte: d, $lt: nextD } }),
          Expert.countDocuments({ createdAt: { $gte: d, $lt: nextD } })
        ]).then(([userCount, expertCount]) => ({
          name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: userCount,
          experts: expertCount,
          total: userCount + expertCount
        }))
      );
    }

    // 3. Build last 6 months parallel promises
    const monthsPromises = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      const nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      monthsPromises.push(
        Promise.all([
          User.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } }),
          Expert.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } })
        ]).then(([userCount, expertCount]) => ({
          name: d.toLocaleDateString('en-US', { month: 'short' }),
          users: userCount,
          experts: expertCount,
        }))
      );
    }

    // Run all tasks in parallel
    const [
      [
        totalUsers,
        totalExperts,
        pendingExperts,
        approvedExperts,
        rejectedExperts,
        activeExperts,
        suspendedExperts,
        totalCategories,
        totalSubCategories
      ],
      last7Days,
      last6Months
    ] = await Promise.all([
      summaryPromise,
      Promise.all(daysPromises),
      Promise.all(monthsPromises)
    ]);

    res.json({
      totalUsers,
      totalExperts,
      pendingExperts,
      approvedExperts,
      rejectedExperts,
      activeExperts,
      suspendedExperts,
      totalCategories,
      totalSubCategories,
      last7Days,
      last6Months
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

// --- Users ---
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) query.status = req.query.status;
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex }
      ];
    }

    const users = await User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(query);

    res.json({
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// --- Experts ---
exports.getExperts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.verificationStatus) query.verificationStatus = req.query.verificationStatus;
    if (req.query.bankVerificationStatus) query['bankDetails.verificationStatus'] = req.query.bankVerificationStatus;
    if (req.query.status) query.status = req.query.status;
    if (req.query.categoryId) query.categoryId = req.query.categoryId;
    if (req.query.subCategoryId) query.subCategoryId = req.query.subCategoryId;
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex }
      ];
    }

    const experts = await Expert.find(query)
      .select('-password')
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Expert.countDocuments(query);

    res.json({
      data: experts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching experts', error: error.message });
  }
};

exports.getExpertById = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id)
      .select('-password')
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');
    if (!expert) return res.status(404).json({ message: 'Expert not found' });
    res.json(expert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expert', error: error.message });
  }
};

exports.approveExpert = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    // Strict validation: check all mandatory documents for this expert
    let requirements = [];
    if (expert.categoryId) {
      requirements = await getRequirementsForCategory(expert.categoryId, expert.subCategoryId);
    }

    const mandatoryReqs = requirements.filter(r => r.isMandatory);
    if (mandatoryReqs.length > 0) {
      const documents = await ExpertDocument.find({ expertId: expert._id });
      
      const unverifiedMandatory = mandatoryReqs.filter(reqItem => {
        const doc = documents.find(d => 
          d.docKey === reqItem.docKey || 
          (d.requirementId && d.requirementId.toString() === reqItem._id.toString())
        );
        return !doc || doc.status !== 'VERIFIED';
      });

      if (unverifiedMandatory.length > 0) {
        return res.status(400).json({
          message: `Cannot approve expert: All mandatory category qualification documents must be verified first. Unverified document(s): ${unverifiedMandatory.map(m => m.name).join(', ')}`,
          unverifiedDocuments: unverifiedMandatory.map(m => ({ docKey: m.docKey, name: m.name }))
        });
      }
    }

    const adminId = (req.user && req.user._id) ? req.user._id : null;
    const updateFields = {
      verificationStatus: 'APPROVED',
      status: 'ACTIVE',
      approvedAt: new Date(),
      approvedBy: adminId,
      rejectionReason: ''
    };

    if (!expert.rates || expert.rates.chat < 5 || expert.rates.audio < 10 || expert.rates.video < 20) {
      updateFields.rates = {
        chat: Math.max(5, expert.rates?.chat || 5),
        audio: Math.max(10, expert.rates?.audio || 10),
        video: Math.max(20, expert.rates?.video || 20)
      };
      updateFields.pricePerMinute = Math.max(5, expert.pricePerMinute || 5);
    }

    const updated = await Expert.findByIdAndUpdate(
      expert._id,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select('-password');

    // Send notifications to expert
    try {
      const io = req.app.get('io');
      const { sendNotification } = require('../utils/notificationDispatcher');
      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Expert Application Approved!',
        message: 'Congratulations! Your qualifications and professional documents have been verified. Your profile is now approved and active to receive consultation bookings.',
        type: 'expert_approved',
        badge: 'Approved',
        actionText: 'Go to dashboard',
        link: '/expert/dashboard'
      }, io).catch(() => {});

      if (io) {
        io.to(`user_${expert._id}`).emit('expert_status_updated', {
          verificationStatus: 'APPROVED',
          status: 'ACTIVE',
          message: 'Your expert application and qualification documents have been approved by Administrator.'
        });
      }
    } catch (e) {}

    res.json({ message: 'Expert approved successfully', expert: updated });
  } catch (error) {
    console.error('approveExpert error:', error);
    res.status(500).json({ message: 'Error approving expert', error: error.message });
  }
};

exports.rejectExpert = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const adminId = (req.user && req.user._id) ? req.user._id : null;

    const updated = await Expert.findByIdAndUpdate(
      expert._id,
      {
        $set: {
          verificationStatus: 'REJECTED',
          rejectionReason: reason.trim(),
          rejectedAt: new Date(),
          rejectedBy: adminId
        }
      },
      { new: true, runValidators: false }
    ).select('-password');

    // Send notification to expert
    try {
      const io = req.app.get('io');
      const { sendNotification } = require('../utils/notificationDispatcher');
      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Expert Application Review Update',
        message: `Your application could not be approved at this time: "${reason.trim()}". Please review your documents and update as requested.`,
        type: 'expert_rejected',
        badge: 'Alert',
        actionText: 'Review documents',
        link: '/expert/settings'
      }, io).catch(() => {});

      if (io) {
        io.to(`user_${expert._id}`).emit('expert_status_updated', {
          verificationStatus: 'REJECTED',
          rejectionReason: reason.trim(),
          message: `Your application was rejected: "${reason.trim()}".`
        });
      }
    } catch (e) {}

    res.json({ message: 'Expert rejected', expert: updated });
  } catch (error) {
    console.error('rejectExpert error:', error);
    res.status(500).json({ message: 'Error rejecting expert', error: error.message });
  }
};

exports.approveExpertBankDetails = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    if (!expert.bankDetails || !expert.bankDetails.accountNumber) {
      return res.status(400).json({ message: 'No bank details submitted for this expert.' });
    }

    const adminId = (req.user && req.user._id) ? req.user._id : null;

    const updated = await Expert.findByIdAndUpdate(
      expert._id,
      {
        $set: {
          'bankDetails.verificationStatus': 'APPROVED',
          'bankDetails.rejectionReason': '',
          'bankDetails.verifiedAt': new Date(),
          'bankDetails.verifiedBy': adminId
        }
      },
      { new: true, runValidators: false }
    ).select('-password');

    // Notify expert via In-App / Email Notification
    try {
      const io = req.app.get('io');
      const { sendNotification } = require('../utils/notificationDispatcher');
      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Bank Details Approved',
        message: 'Your bank details and passbook document have been verified and approved by the Administrator. Payouts are now enabled.',
        actionText: 'View Bank Settings',
        link: '/expert/settings',
        type: 'bank_verified',
        badge: 'Verified'
      }, io).catch(() => {});

      // Instant Real-time Socket broadcast directly to expert
      if (io) {
        io.to(`user_${expert._id}`).emit('bank_status_updated', {
          expertId: expert._id,
          verificationStatus: 'APPROVED',
          bankDetails: updated.bankDetails,
          message: 'Your bank details and passbook have been verified and approved by Administrator!'
        });
        io.to(expert._id.toString()).emit('bank_status_updated', {
          expertId: expert._id,
          verificationStatus: 'APPROVED',
          bankDetails: updated.bankDetails,
          message: 'Your bank details and passbook have been verified and approved by Administrator!'
        });
      }
    } catch (e) {}

    res.json({ message: 'Bank details approved successfully', expert: updated });
  } catch (error) {
    console.error('approveExpertBankDetails error:', error);
    res.status(500).json({ message: 'Error approving bank details', error: error.message });
  }
};

exports.rejectExpertBankDetails = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const expert = await Expert.findById(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const adminId = (req.user && req.user._id) ? req.user._id : null;

    const updated = await Expert.findByIdAndUpdate(
      expert._id,
      {
        $set: {
          'bankDetails.verificationStatus': 'REJECTED',
          'bankDetails.rejectionReason': reason.trim(),
          'bankDetails.verifiedAt': new Date(),
          'bankDetails.verifiedBy': adminId
        }
      },
      { new: true, runValidators: false }
    ).select('-password');

    // Notify expert via In-App / Email Notification
    try {
      const io = req.app.get('io');
      const { sendNotification } = require('../utils/notificationDispatcher');
      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Bank Details Verification Rejected',
        message: `Your bank verification was rejected: "${reason.trim()}". Please update your details and re-upload your passbook image.`,
        actionText: 'Update Bank Details',
        link: '/expert/settings',
        type: 'bank_rejected',
        badge: 'Alert'
      }, io).catch(() => {});

      // Instant Real-time Socket broadcast directly to expert
      if (io) {
        io.to(`user_${expert._id}`).emit('bank_status_updated', {
          expertId: expert._id,
          verificationStatus: 'REJECTED',
          rejectionReason: reason.trim(),
          bankDetails: updated.bankDetails,
          message: `Your bank verification was rejected: "${reason.trim()}". Please update and re-upload your passbook.`
        });
        io.to(expert._id.toString()).emit('bank_status_updated', {
          expertId: expert._id,
          verificationStatus: 'REJECTED',
          rejectionReason: reason.trim(),
          bankDetails: updated.bankDetails,
          message: `Your bank verification was rejected: "${reason.trim()}". Please update and re-upload your passbook.`
        });
      }
    } catch (e) {}

    res.json({ message: 'Bank details rejected', expert: updated });
  } catch (error) {
    console.error('rejectExpertBankDetails error:', error);
    res.status(500).json({ message: 'Error rejecting bank details', error: error.message });
  }
};

exports.updateExpertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const expert = await Expert.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!expert) return res.status(404).json({ message: 'Expert not found' });
    
    res.json({ message: 'Expert status updated', expert });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expert status', error: error.message });
  }
};

exports.deleteExpert = async (req, res) => {
  try {
    const expert = await Expert.findByIdAndDelete(req.params.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });
    res.json({ message: 'Expert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expert', error: error.message });
  }
};

// --- Categories ---
exports.getCategories = async (req, res) => {
  try {
    let query = {};
    if (req.query.status) query.status = req.query.status;
    
    const categories = await Category.find(query).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, status, commissionRate } = req.body;
    
    // Simple validation
    if (!name || !slug) return res.status(400).json({ message: 'Name and slug are required' });

    let parsedCommission = null;
    if (commissionRate !== undefined && commissionRate !== null && commissionRate !== '') {
      parsedCommission = Number(commissionRate);
      if (isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
        return res.status(400).json({ message: 'Commission rate must be a valid percentage between 0 and 100' });
      }
    }
    
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Category name already exists' });

    const category = new Category({
      name,
      slug,
      description,
      status,
      commissionRate: parsedCommission
    });
    await category.save();
    
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, status, commissionRate } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;

    if (commissionRate !== undefined) {
      if (commissionRate === null || commissionRate === '') {
        category.commissionRate = null; // Revert to global platform default
      } else {
        const parsedCommission = Number(commissionRate);
        if (isNaN(parsedCommission) || parsedCommission < 0 || parsedCommission > 100) {
          return res.status(400).json({ message: 'Commission rate must be a valid percentage between 0 and 100' });
        }
        category.commissionRate = parsedCommission;
      }
    }
    
    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// --- SubCategories ---
exports.getSubCategories = async (req, res) => {
  try {
    let query = {};
    if (req.query.categoryId) query.categoryId = req.query.categoryId;
    if (req.query.status) query.status = req.query.status;
    
    const subCategories = await SubCategory.find(query).populate('categoryId', 'name').sort({ createdAt: -1 });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sub-categories', error: error.message });
  }
};

exports.createSubCategory = async (req, res) => {
  try {
    const { name, slug, categoryId, description, status } = req.body;
    
    if (!name || !slug || !categoryId) return res.status(400).json({ message: 'Name, slug, and categoryId are required' });
    
    const category = await Category.findById(categoryId);
    if (!category) return res.status(400).json({ message: 'Parent category not found' });
    if (category.status !== 'ACTIVE') return res.status(400).json({ message: 'Cannot create sub-category for an inactive category' });

    const exists = await SubCategory.findOne({ name, categoryId });
    if (exists) return res.status(400).json({ message: 'Sub-category name already exists in this category' });

    const subCategory = new SubCategory({ name, slug, categoryId, description, status });
    await subCategory.save();
    
    res.status(201).json({ message: 'Sub-category created', subCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error creating sub-category', error: error.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const { name, slug, categoryId, description, status } = req.body;
    
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) return res.status(404).json({ message: 'Sub-category not found' });
    
    if (name) subCategory.name = name;
    if (slug) subCategory.slug = slug;
    if (categoryId) subCategory.categoryId = categoryId;
    if (description !== undefined) subCategory.description = description;
    if (status) subCategory.status = status;
    
    await subCategory.save();
    res.json({ message: 'Sub-category updated', subCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error updating sub-category', error: error.message });
  }
};

// --- Admin Profile ---
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select('-password');
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, mobile, location, bio, profileImage } = req.body;
    
    const admin = await Admin.findById(req.user._id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    
    if (name) admin.name = name;
    if (mobile !== undefined) admin.mobile = mobile;
    if (location !== undefined) admin.location = location;
    if (bio !== undefined) admin.bio = bio;
    if (profileImage !== undefined) {
      if (typeof profileImage === 'string' && profileImage.length > 0) {
        const approxBytes = Math.round((profileImage.length * 3) / 4);
        if (approxBytes > 1.2 * 1024 * 1024) {
          return res.status(400).json({ message: 'Profile photo size exceeds maximum 1MB limit.' });
        }
      }
      admin.profileImage = profileImage;
    }
    
    await admin.save();
    
    res.json({ message: 'Profile updated successfully', user: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      mobile: admin.mobile,
      location: admin.location,
      bio: admin.bio,
      profileImage: admin.profileImage
    } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// --- Sidebar Stats (lightweight) ---
exports.getSidebarStats = async (req, res) => {
  try {
    const [
      pendingExperts,
      totalConsultations,
      pendingConsultations,
      totalUsers,
      totalExperts,
      pendingInquiries
    ] = await Promise.all([
      Expert.countDocuments({ verificationStatus: 'PENDING' }),
      Consultation.countDocuments(),
      Consultation.countDocuments({ status: 'scheduled' }),
      User.countDocuments(),
      Expert.countDocuments(),
      ContactInquiry.countDocuments({ status: 'PENDING' })
    ]);

    res.json({
      pendingExperts,
      totalConsultations,
      pendingConsultations,
      totalUsers,
      totalExperts,
      pendingInquiries
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sidebar stats', error: error.message });
  }
};

// --- Consultations ---
exports.getAllConsultations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.type) query.type = req.query.type;

    if (req.query.search) {
      // Search is done after populate, so we handle this differently
    }

    const consultations = await Consultation.find(query)
      .populate('user', 'name email profileImage')
      .populate('expert', 'name email profileImage specialty categoryId')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Consultation.countDocuments(query);

    res.json({
      data: consultations,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations', error: error.message });
  }
};

exports.getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('user', 'name email mobile profileImage')
      .populate('expert', 'name email mobile profileImage specialty categoryId');
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultation', error: error.message });
  }
};

exports.updateConsultationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email').populate('expert', 'name email');

    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    res.json({ message: 'Status updated', consultation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating consultation status', error: error.message });
  }
};

exports.getConsultationStats = async (req, res) => {
  try {
    const total = await Consultation.countDocuments();
    const scheduled = await Consultation.countDocuments({ status: 'scheduled' });
    const ongoing = await Consultation.countDocuments({ status: 'ongoing' });
    const completed = await Consultation.countDocuments({ status: 'completed' });
    const cancelled = await Consultation.countDocuments({ status: 'cancelled' });

    const totalRevenue = await Consultation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1); d.setHours(0, 0, 0, 0);
      const nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const count = await Consultation.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } });
      const rev = await Consultation.aggregate([
        { $match: { createdAt: { $gte: d, $lt: nextMonth }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$cost' } } }
      ]);

      last6Months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        consultations: count,
        revenue: rev[0]?.total || 0
      });
    }

    res.json({
      total, scheduled, ongoing, completed, cancelled,
      totalRevenue: totalRevenue[0]?.total || 0,
      last6Months
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultation stats', error: error.message });
  }
};

// GET /api/admin/global-search?q=...
exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ users: [], experts: [], consultations: [] });
    }
    const regex = new RegExp(q, 'i');

    const [users, experts, consultations] = await Promise.all([
      User.find({
        $or: [{ name: regex }, { email: regex }, { mobile: regex }]
      }).select('name email role status profileImage createdAt').limit(6),

      Expert.find({
        $or: [{ name: regex }, { email: regex }, { specialty: regex }, { specialization: regex }]
      }).select('name email specialty categoryId status verificationStatus profileImage rating rates').populate('categoryId', 'name').limit(6),

      Consultation.find({})
        .populate({
          path: 'user',
          select: 'name email profileImage',
          match: { $or: [{ name: regex }, { email: regex }] }
        })
        .populate({
          path: 'expert',
          select: 'name email profileImage specialty',
          match: { $or: [{ name: regex }, { email: regex }] }
        })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const matchingConsultations = consultations
      .filter(c => c.user || c.expert)
      .slice(0, 5);

    res.json({
      users,
      experts,
      consultations: matchingConsultations
    });
  } catch (error) {
    res.status(500).json({ message: 'Global search error', error: error.message });
  }
};

