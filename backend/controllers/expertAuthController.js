const jwt = require('jsonwebtoken');
const Expert = require('../models/Expert');
const User = require('../models/User');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const CategoryDocumentRequirement = require('../models/CategoryDocumentRequirement');
const ExpertDocument = require('../models/ExpertDocument');
const Setting = require('../models/Setting');
const { sendNotification } = require('../utils/notificationDispatcher');
const { getRequirementsForCategory, validateUploadedFile } = require('../utils/documentRequirementsHelper');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'EXPERT' }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register a new expert with category documents
// @route   POST /api/auth/expert/register
const registerExpert = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialty,
      pricePerMinute,
      mobile,
      categoryId,
      subCategoryId,
      manualCategory,
      manualSubCategory,
      country,
      languages,
      documents,
      latitude,
      longitude,
      city,
      state
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    // Resolve specialty with fallback to manual category/subcategory if provided
    const resolvedSpecialty = (typeof specialty === 'string' && specialty.trim()) 
      ? specialty.trim() 
      : (typeof manualSubCategory === 'string' && manualSubCategory.trim() 
          ? manualSubCategory.trim() 
          : (typeof manualCategory === 'string' && manualCategory.trim() ? manualCategory.trim() : ''));

    if (!resolvedSpecialty) {
      return res.status(400).json({ message: 'Specialty is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expertExists = await Expert.findOne({ email: normalizedEmail });
    if (expertExists) {
      return res.status(400).json({ message: 'Expert already exists with this email' });
    }

    // Category and subcategory validation
    let validCategory = null;
    let validSubCategory = null;
    let categoryRequirements = [];

    const isManualCategory = categoryId === 'MANUAL' || (!categoryId && manualCategory);

    if (isManualCategory && manualCategory && typeof manualCategory === 'string' && manualCategory.trim()) {
      const cleanCatName = manualCategory.trim();
      validCategory = await Category.findOne({ name: { $regex: new RegExp(`^${cleanCatName}$`, 'i') } });
      if (!validCategory) {
        const baseSlug = cleanCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'category';
        validCategory = await Category.create({
          name: cleanCatName,
          slug: `${baseSlug}-${Date.now().toString(36)}`,
          description: `Custom category added via expert registration by ${name.trim()}`,
          icon: 'category',
          status: 'ACTIVE'
        });
      }

      if (manualSubCategory && typeof manualSubCategory === 'string' && manualSubCategory.trim()) {
        const cleanSubName = manualSubCategory.trim();
        validSubCategory = await SubCategory.findOne({ 
          categoryId: validCategory._id, 
          name: { $regex: new RegExp(`^${cleanSubName}$`, 'i') } 
        });
        if (!validSubCategory) {
          const baseSubSlug = cleanSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'sub';
          validSubCategory = await SubCategory.create({
            name: cleanSubName,
            slug: `${baseSubSlug}-${Date.now().toString(36)}`,
            categoryId: validCategory._id,
            status: 'ACTIVE'
          });
        }
      }
    } else if (categoryId && categoryId !== 'MANUAL') {
      validCategory = await Category.findById(categoryId);
      if (!validCategory) {
        return res.status(400).json({ message: 'Selected Category is invalid' });
      }

      if (subCategoryId) {
        validSubCategory = await SubCategory.findOne({ _id: subCategoryId, categoryId });
        if (!validSubCategory) {
          return res.status(400).json({ message: 'Selected Subcategory is invalid for this category' });
        }
      }

      // Fetch dynamic document requirements for this category/subcategory
      categoryRequirements = await getRequirementsForCategory(categoryId, subCategoryId || null);
    }

    const uploadedDocs = Array.isArray(documents) ? documents : [];

    // Verify mandatory document requirements
    const mandatoryRequirements = categoryRequirements.filter(r => r.isMandatory);
    for (const mandatoryReq of mandatoryRequirements) {
      const matched = uploadedDocs.find(d => 
        d && (d.docKey === mandatoryReq.docKey || (d.requirementId && d.requirementId.toString() === mandatoryReq._id.toString()))
      );

      if (!matched || !matched.fileData) {
        return res.status(400).json({
          message: `Mandatory document "${mandatoryReq.name}" is strictly required for registration.`
        });
      }
    }

    // Validate uploaded file types and sizes
    const validatedFiles = [];
    for (const doc of uploadedDocs) {
      if (!doc || !doc.fileData) continue;

      const reqItem = categoryRequirements.find(r => 
        r.docKey === doc.docKey || (doc.requirementId && r._id.toString() === doc.requirementId.toString())
      );

      const allowedFormats = reqItem ? reqItem.allowedFormats : ['pdf', 'jpg', 'jpeg', 'png'];
      const maxMb = reqItem ? reqItem.maxFileSizeMb : 5;

      const val = validateUploadedFile(doc.fileData, doc.fileName, allowedFormats, maxMb);
      if (!val.valid) {
        return res.status(400).json({
          message: `Document "${doc.docName || doc.docKey}": ${val.error}`
        });
      }

      validatedFiles.push({
        requirementId: reqItem ? reqItem._id : null,
        docKey: doc.docKey || `doc_${Date.now()}`,
        docName: doc.docName || reqItem?.name || 'Document',
        description: reqItem?.description || '',
        fileName: doc.fileName || `${doc.docKey}.${val.fileType.split('/')[1] || 'pdf'}`,
        fileType: val.fileType,
        fileSize: val.fileSize,
        fileData: doc.fileData,
        isMandatory: reqItem ? reqItem.isMandatory : Boolean(doc.isMandatory)
      });
    }

    const settings = await Setting.findOne({ singletonKey: 'GLOBAL_SETTINGS' });
    const isAutoApprove = Boolean(settings && settings.autoApproveExperts && mandatoryRequirements.length === 0);
    const initialStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    const initialPrice = Math.max(5, Number(pricePerMinute) || 5);

    // Parse coordinates if provided
    const parsedLat = (latitude !== undefined && latitude !== null && latitude !== '') ? Number(latitude) : null;
    const parsedLng = (longitude !== undefined && longitude !== null && longitude !== '') ? Number(longitude) : null;
    const hasValidCoords = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

    // Process languages
    let parsedLanguages = ['English', 'Hindi'];
    if (Array.isArray(languages) && languages.length > 0) {
      parsedLanguages = languages.map(l => String(l).trim()).filter(Boolean);
    } else if (typeof languages === 'string' && languages.trim()) {
      parsedLanguages = languages.split(',').map(l => l.trim()).filter(Boolean);
    }

    const expert = await Expert.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      specialty: resolvedSpecialty,
      categoryId: validCategory ? validCategory._id : undefined,
      subCategoryId: validSubCategory ? validSubCategory._id : undefined,
      country: country && typeof country === 'string' && country.trim() ? country.trim() : 'India',
      languages: parsedLanguages.length > 0 ? parsedLanguages : ['English', 'Hindi'],
      pricePerMinute: initialPrice,
      rates: {
        chat: initialPrice,
        audio: Math.max(10, initialPrice),
        video: Math.max(20, initialPrice)
      },
      mobile: typeof mobile === 'string' ? mobile.trim() : undefined,
      role: 'EXPERT',
      verificationStatus: initialStatus,
      latitude: hasValidCoords ? parsedLat : null,
      longitude: hasValidCoords ? parsedLng : null,
      location: hasValidCoords ? {
        type: 'Point',
        coordinates: [parsedLng, parsedLat],
        city: city || undefined,
        state: state || undefined,
        country: country || 'India'
      } : undefined,
      city: city || undefined,
      state: state || undefined
    });

    if (expert) {
      // Save all uploaded qualification documents
      for (const item of validatedFiles) {
        await ExpertDocument.create({
          expertId: expert._id,
          requirementId: item.requirementId,
          docKey: item.docKey,
          docName: item.docName,
          description: item.description,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
          fileData: item.fileData,
          isMandatory: item.isMandatory,
          status: 'PENDING',
          uploadedAt: new Date(),
          history: [{
            action: 'UPLOADED',
            status: 'PENDING',
            byRole: 'EXPERT',
            byId: expert._id,
            createdAt: new Date()
          }]
        });
      }

      const io = req.app.get('io');
      
      // Notify Admin
      sendNotification({
        recipientRole: 'ADMIN',
        recipientModel: 'Admin',
        title: 'New Expert Registration & Documents Submitted',
        message: `${expert.name} submitted an application with ${validatedFiles.length} verification document(s) for "${validCategory?.name || expert.specialty}".`,
        type: 'expert_registration',
        link: '/expert-applications',
        actionText: 'Review application & documents',
        badge: 'New'
      }, io).catch(e => console.error('Expert reg notification error:', e));

      // Notify Expert
      sendNotification({
        recipient: expert._id,
        recipientRole: 'EXPERT',
        recipientModel: 'Expert',
        title: 'Application & Documents Received',
        message: 'Your registration application and category qualification documents have been received. Our compliance team will review them.',
        type: 'document_submitted',
        badge: 'Pending Review',
        actionText: 'View status',
        link: '/expert/settings'
      }, io).catch(e => console.error('Expert reg welcome notification error:', e));

      // Keep User account synchronized so same email & password works for User Login
      try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (!existingUser) {
          await User.create({
            name: expert.name,
            email: normalizedEmail,
            password: password, // Mongoose User pre('save') hashes this plain-text password
            mobile: expert.mobile,
            role: 'USER',
            status: 'ACTIVE',
          });
        } else if (!existingUser.password) {
          existingUser.password = password;
          await existingUser.save();
        }
      } catch (userSyncErr) {
        console.warn('User account sync warning during expert registration:', userSyncErr.message);
      }

      res.status(201).json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid expert data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth expert & get token
// @route   POST /api/auth/expert/login
const loginExpert = async (req, res) => {
  try {
    const { email, password, reactivate } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let expert = await Expert.findOne({ email: normalizedEmail });
    const user = await User.findOne({ email: normalizedEmail });

    // Sync password if user changed it in user portal
    if (expert && user) {
      const expertMatches = await expert.matchPassword(password);
      if (!expertMatches && (await user.matchPassword(password))) {
        expert.password = password;
        await expert.save();
      }
    }

    if (!expert) {
      if (user) {
        return res.status(403).json({
          message: 'This email is registered as a Client/User, but not yet registered as an Expert. Please use "Become an Expert" to register.',
          isUserOnly: true,
        });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (expert && (await expert.matchPassword(password))) {
      if (expert.status === 'SUSPENDED') {
        if (reactivate) {
          expert.status = 'ACTIVE';
          await expert.save();
        } else {
          return res.status(403).json({ 
            message: 'Your account is currently deactivated. Would you like to reactivate it?',
            isDeactivated: true,
            status: 'SUSPENDED'
          });
        }
      } else if (expert.status !== 'ACTIVE') {
        return res.status(403).json({ 
          message: `Account is ${expert.status.toLowerCase()}`,
          isDeactivated: false,
          status: expert.status
        });
      }

      // Auto-set expert status to online upon login
      expert.onlineStatus = 'online';

      // Update live coordinates on login if provided
      if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
        const loginLat = Number(req.body.latitude);
        const loginLng = Number(req.body.longitude);
        if (!isNaN(loginLat) && !isNaN(loginLng)) {
          expert.latitude = loginLat;
          expert.longitude = loginLng;
          if (!expert.location) {
            expert.location = { type: 'Point', coordinates: [loginLng, loginLat] };
          } else {
            expert.location.coordinates = [loginLng, loginLat];
          }
        }
      }

      await expert.save();

      res.json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        onlineStatus: expert.onlineStatus,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reactivate expert account
// @route   POST /api/auth/expert/reactivate
const reactivateExpert = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    let expert = await Expert.findOne({ email: normalizedEmail });
    const user = await User.findOne({ email: normalizedEmail });

    if (expert && user && !(await expert.matchPassword(password)) && (await user.matchPassword(password))) {
      expert.password = password;
      await expert.save();
    }

    if (expert && (await expert.matchPassword(password))) {
      if (expert.status === 'BLOCKED') {
        return res.status(403).json({ 
          message: 'Your account has been blocked by administration. Please contact support.',
          isDeactivated: false,
          status: 'BLOCKED'
        });
      }

      expert.status = 'ACTIVE';
      await expert.save();

      res.json({
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        role: expert.role,
        verificationStatus: expert.verificationStatus,
        token: generateToken(expert._id),
        message: 'Account reactivated successfully!'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerExpert,
  loginExpert,
  reactivateExpert,
};
