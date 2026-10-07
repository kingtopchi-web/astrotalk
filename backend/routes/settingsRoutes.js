const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, settingsController.getSettings);
router.put('/profile', protect, settingsController.updateProfile);
router.put('/password', protect, settingsController.updatePassword);
router.put('/preferences', protect, settingsController.updatePreferences);
router.post('/deactivate', protect, settingsController.deactivateAccount);

module.exports = router;
