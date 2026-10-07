const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getExpertServices,
  getPublicExpertServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/expertServiceController');

// Public route to view an expert's active services
router.get('/public/:expertId', getPublicExpertServices);

// Protected Expert routes
router.use(protect);
router.use(authorizeRoles('EXPERT'));

router.route('/')
  .get(getExpertServices)
  .post(createService);

router.route('/:id')
  .put(updateService)
  .delete(deleteService);

module.exports = router;
