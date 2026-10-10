const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');

// @route   GET /api/experts
// @desc    Get all experts with filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      subCategory, 
      status, 
      rating, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = {};

    // Search by name, specialty, or specialization
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.categoryId = category;
    if (subCategory) query.subCategoryId = subCategory;
    if (status) query.status = status; // e.g., 'APPROVED'
    if (rating) query.rating = { $gte: Number(rating) };

    if (minPrice || maxPrice) {
      query['rates.chat'] = {};
      if (minPrice) query['rates.chat'].$gte = Number(minPrice);
      if (maxPrice) query['rates.chat'].$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const experts = await Expert.find(query)
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ rating: -1, createdAt: -1 });

    const total = await Expert.countDocuments(query);

    res.json({
      experts,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Experts Fetch Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const Consultation = require('../models/Consultation');

// @route   PUT /api/experts/settings
// @desc    Update expert settings (password, notifications, bank)
router.put('/settings', protect, authorizeRoles('EXPERT'), async (req, res) => {
  try {
    const { currentPassword, newPassword, notificationPreferences, bankDetails } = req.body;
    const expert = await Expert.findById(req.user._id);
    
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    if (currentPassword && newPassword) {
      const isMatch = await expert.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid current password' });
      }
      expert.password = newPassword;
    }

    if (notificationPreferences) {
      expert.notificationPreferences = { ...expert.notificationPreferences, ...notificationPreferences };
    }

    if (bankDetails) {
      expert.bankDetails = { ...expert.bankDetails, ...bankDetails };
    }

    await expert.save();
    // Return updated expert without password
    const updatedExpert = await Expert.findById(expert._id).select('-password');
    res.json({ message: 'Settings updated successfully', expert: updatedExpert });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/experts/my-clients
// @desc    Get all unique clients for an expert
router.get('/my-clients', protect, authorizeRoles('EXPERT'), async (req, res) => {
  try {
    const consultations = await Consultation.find({ expert: req.user._id }).populate('user', 'name email profileImage mobile');
    
    // Extract unique users
    const clientsMap = new Map();
    consultations.forEach(c => {
      if (c.user && !clientsMap.has(c.user._id.toString())) {
        clientsMap.set(c.user._id.toString(), {
          _id: c.user._id,
          name: c.user.name,
          email: c.user.email,
          profileImage: c.user.profileImage,
          mobile: c.user.mobile,
          totalConsultations: 1,
          totalSpent: c.cost,
          lastConsultation: c.startTime
        });
      } else if (c.user) {
        const existing = clientsMap.get(c.user._id.toString());
        existing.totalConsultations += 1;
        existing.totalSpent += c.cost;
        if (new Date(c.startTime) > new Date(existing.lastConsultation)) {
          existing.lastConsultation = c.startTime;
        }
      }
    });

    const clients = Array.from(clientsMap.values()).sort((a, b) => new Date(b.lastConsultation) - new Date(a.lastConsultation));
    res.json(clients);
  } catch (error) {
    console.error('Fetch clients error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/experts/:id
// @desc    Get single expert by ID
router.get('/:id', async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.id);
    if (expert) {
      res.json(expert);
    } else {
      res.status(404).json({ message: 'Expert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});



module.exports = router;
