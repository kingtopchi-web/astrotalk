const ExpertService = require('../models/ExpertService');
const Consultation = require('../models/Consultation');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');

// @desc    Get all services for the logged in expert
// @route   GET /api/expert-services
// @access  Private (EXPERT)
exports.getExpertServices = async (req, res) => {
  try {
    const services = await ExpertService.find({ 
      expertId: req.user._id, 
      status: { $ne: 'ARCHIVED' } 
    }).populate('categoryId', 'name').populate('subcategoryId', 'name').sort('-createdAt');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
};

// @desc    Get all active services for a public expert profile
// @route   GET /api/expert-services/public/:expertId
// @access  Public
exports.getPublicExpertServices = async (req, res) => {
  try {
    const services = await ExpertService.find({ 
      expertId: req.params.expertId, 
      status: 'ACTIVE' 
    }).populate('categoryId', 'name').populate('subcategoryId', 'name');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public services', error: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/expert-services
// @access  Private (EXPERT)
exports.createService = async (req, res) => {
  try {
    const { 
      categoryId, subcategoryId, name, description, price, 
      duration, consultationType, bookingType 
    } = req.body;

    const newService = new ExpertService({
      expertId: req.user._id,
      categoryId,
      subcategoryId: subcategoryId || null,
      name,
      description,
      price,
      duration,
      consultationType,
      bookingType,
      status: 'ACTIVE'
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/expert-services/:id
// @access  Private (EXPERT)
exports.updateService = async (req, res) => {
  try {
    const service = await ExpertService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const { 
      categoryId, subcategoryId, name, description, price, 
      duration, consultationType, bookingType, status 
    } = req.body;

    service.categoryId = categoryId || service.categoryId;
    service.subcategoryId = subcategoryId || service.subcategoryId;
    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price !== undefined ? price : service.price;
    service.duration = duration || service.duration;
    service.consultationType = consultationType || service.consultationType;
    service.bookingType = bookingType || service.bookingType;
    if (status) service.status = status;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
};

// @desc    Delete (archive) a service
// @route   DELETE /api/expert-services/:id
// @access  Private (EXPERT)
exports.deleteService = async (req, res) => {
  try {
    const service = await ExpertService.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    // Soft delete (archive) so historical bookings remain intact
    service.status = 'ARCHIVED';
    await service.save();

    res.json({ message: 'Service archived successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
};
