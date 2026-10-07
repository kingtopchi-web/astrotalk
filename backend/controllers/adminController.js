const User = require('../models/User');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Admin = require('../models/Admin');
const Consultation = require('../models/Consultation');
const Payment = require('../models/Payment');

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

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExperts = await Expert.countDocuments();
    const pendingExperts = await Expert.countDocuments({ verificationStatus: 'PENDING' });
    const approvedExperts = await Expert.countDocuments({ verificationStatus: 'APPROVED' });
    const rejectedExperts = await Expert.countDocuments({ verificationStatus: 'REJECTED' });
    const activeExperts = await Expert.countDocuments({ status: 'ACTIVE' });
    const suspendedExperts = await Expert.countDocuments({ status: 'SUSPENDED' });
    const totalCategories = await Category.countDocuments();
    const totalSubCategories = await SubCategory.countDocuments();

    // Generate last 7 days data for AreaChart (Daily Registrations)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const userCount = await User.countDocuments({ createdAt: { $gte: d, $lt: nextD } });
      const expertCount = await Expert.countDocuments({ createdAt: { $gte: d, $lt: nextD } });

      last7Days.push({
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: userCount,
        experts: expertCount,
        total: userCount + expertCount
      });
    }

    // Generate last 6 months data for BarChart (Monthly Growth)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      const nextMonth = new Date(d);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const userCount = await User.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } });
      const expertCount = await Expert.countDocuments({ createdAt: { $gte: d, $lt: nextMonth } });

      last6Months.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        users: userCount,
        experts: expertCount,
      });
    }

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
    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: req.user._id,
        status: 'ACTIVE'
      },
      { new: true }
    );
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    res.json({ message: 'Expert approved successfully', expert });
  } catch (error) {
    res.status(500).json({ message: 'Error approving expert', error: error.message });
  }
};

exports.rejectExpert = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const expert = await Expert.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: 'REJECTED',
        rejectionReason: reason,
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        status: 'BLOCKED'
      },
      { new: true }
    );
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    res.json({ message: 'Expert rejected', expert });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting expert', error: error.message });
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
    const { name, slug, description, status } = req.body;
    
    // Simple validation
    if (!name || !slug) return res.status(400).json({ message: 'Name and slug are required' });
    
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Category name already exists' });

    const category = new Category({ name, slug, description, status });
    await category.save();
    
    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, status } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    
    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (status) category.status = status;
    
    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
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
    if (profileImage !== undefined) admin.profileImage = profileImage;
    
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
    const pendingExperts = await Expert.countDocuments({ verificationStatus: 'PENDING' });
    const totalConsultations = await Consultation.countDocuments();
    const pendingConsultations = await Consultation.countDocuments({ status: 'scheduled' });
    const totalUsers = await User.countDocuments();
    const totalExperts = await Expert.countDocuments();

    res.json({ pendingExperts, totalConsultations, pendingConsultations, totalUsers, totalExperts });
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
