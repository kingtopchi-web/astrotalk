const express = require('express');
const router = express.Router();
const Expert = require('../models/Expert');

// @route   GET /api/experts
// @desc    Get all experts
router.get('/', async (req, res) => {
  try {
    const experts = await Expert.find({});
    res.json(experts);
  } catch (error) {
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
