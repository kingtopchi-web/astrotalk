const User = require('../models/User');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const Setting = require('../models/Setting');

// GET /api/user/profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/user/saved-experts/:id
exports.toggleSaveExpert = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const expertId = req.params.id;
    
    if (!user.savedExperts) user.savedExperts = [];
    const isSaved = user.savedExperts.some(id => id.toString() === expertId.toString());
    if (isSaved) {
      user.savedExperts = user.savedExperts.filter(id => id.toString() !== expertId.toString());
    } else {
      user.savedExperts.push(expertId);
    }
    
    await user.save();
    res.json({ isSaved: !isSaved, savedExperts: user.savedExperts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/user/saved-experts
exports.getSavedExperts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedExperts',
      select: 'name profileImage specialty categoryId subCategoryId pricePerMinute hourlyRate rates rating onlineStatus isVerified bio experience',
      populate: [
        { path: 'categoryId', select: 'name' },
        { path: 'subCategoryId', select: 'name' }
      ]
    });
    res.json(user?.savedExperts || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH /api/user/profile
exports.updateMyProfile = async (req, res) => {
  try {
    // Whitelist only safe fields - never allow role/status escalation
    const allowed = ['name', 'mobile', 'gender', 'dateOfBirth', 'location', 'bio', 'profileImage'];
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/user/experts — only APPROVED + ACTIVE experts
exports.getPublicExperts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Base filter: only public-facing experts
    const query = {
      verificationStatus: 'APPROVED',
      status: 'ACTIVE'
    };

    if (req.query.categoryId) query.categoryId = req.query.categoryId;
    if (req.query.subCategoryId) query.subCategoryId = req.query.subCategoryId;

    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      query.$or = [{ name: re }, { specialty: re }, { specialization: re }];
    }

    const experts = await Expert.find(query)
      .select('-password -documents -rejectionReason -rejectedAt -rejectedBy -approvedBy')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ rating: -1, createdAt: -1 });

    const total = await Expert.countDocuments(query);

    res.json({
      data: experts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/user/experts/:id
exports.getPublicExpertById = async (req, res) => {
  try {
    const expert = await Expert.findOne({
      _id: req.params.id,
      verificationStatus: 'APPROVED',
      status: 'ACTIVE'
    })
      .select('-password -documents -rejectionReason -rejectedAt -rejectedBy -approvedBy')
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug');

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found or not available' });
    }

    res.json(expert);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/user/categories
exports.getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'ACTIVE' }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/user/categories/:categoryId/subcategories
exports.getPublicSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find({
      categoryId: req.params.categoryId,
      status: 'ACTIVE'
    }).sort({ name: 1 });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/public/stats
exports.getPublicStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const verifiedExpertsCount = await Expert.countDocuments({
      $or: [
        { isVerified: true },
        { verificationStatus: 'APPROVED' }
      ]
    });
    const totalExpertsCount = await Expert.countDocuments();
    const finalExperts = verifiedExpertsCount > 0 ? verifiedExpertsCount : totalExpertsCount;

    // Fetch platform settings
    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const enableFreeChat = settings ? settings.enableFreeChat !== false : true;
    const freeChatDurationMinutes = settings?.freeChatDurationMinutes || 5;

    res.json({
      success: true,
      usersCount,
      verifiedExpertsCount: finalExperts,
      enableFreeChat,
      freeChatDurationMinutes,
      platformName: settings?.platformName || 'ExpertHub',
      supportEmail: settings?.supportEmail || 'support@stitchplatform.com',
      contactPhone: settings?.contactPhone || '+91 98765 43210',
      address: settings?.address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/public/settings
exports.getPublicSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    if (!settings) {
      settings = await Setting.create({ singletonKey: 'GLOBAL_SETTINGS' });
    }
    res.json({
      success: true,
      platformName: settings?.platformName || 'ExpertHub',
      supportEmail: settings?.supportEmail || 'support@stitchplatform.com',
      contactPhone: settings?.contactPhone || '+91 98765 43210',
      address: settings?.address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
      enableFreeChat: settings ? settings.enableFreeChat !== false : true,
      freeChatDurationMinutes: settings?.freeChatDurationMinutes || 5
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/public/search?q=...
exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ experts: [], categories: [] });
    }
    const regex = new RegExp(q, 'i');

    const [experts, categories] = await Promise.all([
      Expert.find({
        verificationStatus: 'APPROVED',
        status: 'ACTIVE',
        $or: [{ name: regex }, { specialty: regex }, { specialization: regex }]
      })
      .select('name profileImage specialty rates rating experience pricePerMinute categoryId')
      .populate('categoryId', 'name')
      .limit(6),

      Category.find({
        status: 'ACTIVE',
        name: regex
      }).select('name icon description').limit(4)
    ]);

    res.json({ experts, categories });
  } catch (error) {
    res.status(500).json({ message: 'Search error', error: error.message });
  }
};


