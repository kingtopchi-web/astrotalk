const jwt = require('jsonwebtoken');
const CategoryDocumentRequirement = require('../models/CategoryDocumentRequirement');
const ExpertDocument = require('../models/ExpertDocument');
const Expert = require('../models/Expert');
const Category = require('../models/Category');
const SubCategory = require('../models/SubCategory');
const { sendNotification } = require('../utils/notificationDispatcher');
const {
  getRequirementsForCategory,
  validateUploadedFile
} = require('../utils/documentRequirementsHelper');

/**
 * @desc Get category document requirements
 * @route GET /api/categories/:categoryId/document-requirements
 * @access Public / Authenticated
 */
exports.getCategoryRequirements = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { subCategoryId } = req.query;

    const defaultFallbackDocs = [
      {
        _id: null,
        docKey: 'govt_id_proof',
        name: 'Identity Proof / Government ID (Aadhaar / PAN / Passport)',
        description: 'Valid government photo identity document to verify expert legal identity',
        isMandatory: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSizeMb: 5
      },
      {
        _id: null,
        docKey: 'professional_cert',
        name: 'Educational / Professional Qualification Certificate',
        description: 'Degree, diploma, certificate, or work portfolio proving domain expertise',
        isMandatory: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSizeMb: 5
      },
      {
        _id: null,
        docKey: 'experience_proof',
        name: 'Experience Certificate or Resume / CV',
        description: 'Work history, experience letter or curriculum vitae (optional)',
        isMandatory: false,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxFileSizeMb: 5
      }
    ];

    if (!categoryId || categoryId === 'default' || categoryId === 'MANUAL' || categoryId === 'all') {
      return res.json(defaultFallbackDocs);
    }

    const requirements = await getRequirementsForCategory(categoryId, subCategoryId || null);
    if (!requirements || requirements.length === 0) {
      return res.json(defaultFallbackDocs);
    }

    res.json(requirements);
  } catch (error) {
    console.error('Error fetching category requirements:', error);
    res.status(500).json({ message: 'Error fetching document requirements', error: error.message });
  }
};

/**
 * @desc Admin list document requirements for a category/subcategory
 * @route GET /api/admin/document-requirements
 * @access Admin
 */
exports.getAdminDocumentRequirements = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.query;
    let query = {};
    if (categoryId) query.categoryId = categoryId;
    if (subCategoryId) query.subCategoryId = subCategoryId;

    const requirements = await CategoryDocumentRequirement.find(query)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .sort({ categoryId: 1, isMandatory: -1, createdAt: 1 });

    res.json(requirements);
  } catch (error) {
    console.error('Admin fetch requirements error:', error);
    res.status(500).json({ message: 'Error fetching requirements', error: error.message });
  }
};

/**
 * @desc Admin create a new document requirement
 * @route POST /api/admin/document-requirements
 * @access Admin
 */
exports.createDocumentRequirement = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      name,
      description,
      isMandatory = true,
      allowedFormats = ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb = 5
    } = req.body;

    if (!categoryId || !name || !name.trim()) {
      return res.status(400).json({ message: 'Category ID and Document Name are required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let subCat = null;
    if (subCategoryId) {
      subCat = await SubCategory.findById(subCategoryId);
      if (!subCat) {
        return res.status(404).json({ message: 'Subcategory not found' });
      }
    }

    // Generate unique docKey based on name and category
    const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    const docKey = `${baseSlug}_${Date.now().toString(36)}`;

    const newReq = await CategoryDocumentRequirement.create({
      categoryId,
      subCategoryId: subCategoryId || null,
      docKey,
      name: name.trim(),
      description: description ? description.trim() : '',
      isMandatory: Boolean(isMandatory),
      allowedFormats: Array.isArray(allowedFormats) && allowedFormats.length > 0
        ? allowedFormats.map(f => f.toLowerCase().replace('.', ''))
        : ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMb: Math.max(1, Math.min(25, Number(maxFileSizeMb) || 5)),
      status: 'ACTIVE'
    });

    res.status(201).json({ message: 'Document requirement created successfully', requirement: newReq });
  } catch (error) {
    console.error('Create requirement error:', error);
    res.status(500).json({ message: 'Failed to create requirement', error: error.message });
  }
};

/**
 * @desc Admin update a document requirement
 * @route PATCH /api/admin/document-requirements/:id
 * @access Admin
 */
exports.updateDocumentRequirement = async (req, res) => {
  try {
    const { name, description, isMandatory, allowedFormats, maxFileSizeMb, status } = req.body;

    const reqDoc = await CategoryDocumentRequirement.findById(req.params.id);
    if (!reqDoc) {
      return res.status(404).json({ message: 'Document requirement not found' });
    }

    if (name !== undefined) reqDoc.name = name.trim();
    if (description !== undefined) reqDoc.description = description.trim();
    if (isMandatory !== undefined) reqDoc.isMandatory = Boolean(isMandatory);
    if (allowedFormats !== undefined && Array.isArray(allowedFormats)) {
      reqDoc.allowedFormats = allowedFormats.map(f => f.toLowerCase().replace('.', ''));
    }
    if (maxFileSizeMb !== undefined) {
      reqDoc.maxFileSizeMb = Math.max(1, Math.min(25, Number(maxFileSizeMb) || 5));
    }
    if (status !== undefined) reqDoc.status = status;

    await reqDoc.save();
    res.json({ message: 'Document requirement updated successfully', requirement: reqDoc });
  } catch (error) {
    console.error('Update requirement error:', error);
    res.status(500).json({ message: 'Failed to update requirement', error: error.message });
  }
};

/**
 * @desc Admin delete a document requirement
 * @route DELETE /api/admin/document-requirements/:id
 * @access Admin
 */
exports.deleteDocumentRequirement = async (req, res) => {
  try {
    const reqDoc = await CategoryDocumentRequirement.findById(req.params.id);
    if (!reqDoc) {
      return res.status(404).json({ message: 'Document requirement not found' });
    }

    await reqDoc.deleteOne();
    res.json({ message: 'Document requirement deleted successfully' });
  } catch (error) {
    console.error('Delete requirement error:', error);
    res.status(500).json({ message: 'Failed to delete requirement', error: error.message });
  }
};

/**
 * @desc Get all documents for an expert (Admin inspection view)
 * @route GET /api/admin/experts/:expertId/documents
 * @access Admin
 */
exports.getExpertDocumentsForAdmin = async (req, res) => {
  try {
    const expert = await Expert.findById(req.params.expertId)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .select('-password');

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Retrieve active category requirements checklist
    let requirements = [];
    if (expert.categoryId) {
      requirements = await getRequirementsForCategory(
        expert.categoryId._id || expert.categoryId,
        expert.subCategoryId ? (expert.subCategoryId._id || expert.subCategoryId) : null
      );
    }

    // Retrieve uploaded documents
    const documents = await ExpertDocument.find({ expertId: expert._id })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    // Build checklist & status verification summary
    const mandatoryRequirements = requirements.filter(r => r.isMandatory);
    let mandatoryVerifiedCount = 0;

    const checklist = requirements.map(reqItem => {
      const doc = documents.find(d => 
        d.docKey === reqItem.docKey || 
        (d.requirementId && d.requirementId.toString() === reqItem._id.toString())
      );

      const isVerified = doc && doc.status === 'VERIFIED';
      if (reqItem.isMandatory && isVerified) {
        mandatoryVerifiedCount++;
      }

      return {
        requirement: reqItem,
        uploadedDocument: doc || null,
        isUploaded: Boolean(doc),
        status: doc ? doc.status : 'NOT_SUBMITTED',
        isSatisfied: isVerified
      };
    });

    const allMandatoryVerified = mandatoryRequirements.length === 0 || mandatoryVerifiedCount >= mandatoryRequirements.length;

    res.json({
      expert: {
        _id: expert._id,
        name: expert.name,
        email: expert.email,
        mobile: expert.mobile,
        specialty: expert.specialty,
        qualification: expert.qualification,
        experience: expert.experience,
        bio: expert.bio,
        country: expert.country || 'India',
        languages: expert.languages || ['English', 'Hindi'],
        category: expert.categoryId,
        subCategory: expert.subCategoryId,
        profileImage: expert.profileImage,
        verificationStatus: expert.verificationStatus,
        rejectionReason: expert.rejectionReason,
        rates: expert.rates,
        bankDetails: expert.bankDetails
      },
      summary: {
        totalRequirements: requirements.length,
        mandatoryRequirements: mandatoryRequirements.length,
        mandatoryVerified: mandatoryVerifiedCount,
        allMandatoryVerified,
        totalUploaded: documents.length
      },
      checklist,
      documents
    });
  } catch (error) {
    console.error('Admin get expert documents error:', error);
    res.status(500).json({ message: 'Failed to retrieve expert documents', error: error.message });
  }
};

/**
 * @desc Get documents for current logged-in expert
 * @route GET /api/expert/documents
 * @access Expert
 */
exports.getMyExpertDocuments = async (req, res) => {
  try {
    const expertId = req.user._id;
    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert profile not found' });
    }

    let requirements = [];
    if (expert.categoryId) {
      requirements = await getRequirementsForCategory(expert.categoryId, expert.subCategoryId);
    }

    const documents = await ExpertDocument.find({ expertId })
      .sort({ createdAt: -1 });

    const checklist = requirements.map(r => {
      const doc = documents.find(d => d.docKey === r.docKey || (d.requirementId && d.requirementId.toString() === r._id.toString()));
      return {
        requirement: r,
        uploadedDocument: doc || null,
        status: doc ? doc.status : 'NOT_SUBMITTED'
      };
    });

    res.json({
      verificationStatus: expert.verificationStatus,
      rejectionReason: expert.rejectionReason,
      requirements,
      documents,
      checklist
    });
  } catch (error) {
    console.error('Expert get documents error:', error);
    res.status(500).json({ message: 'Failed to fetch your documents', error: error.message });
  }
};

/**
 * @desc Upload or Replace an Expert Document (Expert action)
 * @route POST /api/expert/documents/upload
 * @access Expert
 */
exports.uploadMyExpertDocument = async (req, res) => {
  try {
    const expertId = req.user._id;
    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const { docKey, docName, requirementId, fileData, fileName } = req.body;

    if (!docKey || !fileData) {
      return res.status(400).json({ message: 'Document key and file data are required.' });
    }

    // Find requirement if exists
    let reqItem = null;
    if (requirementId) {
      reqItem = await CategoryDocumentRequirement.findById(requirementId);
    } else if (expert.categoryId) {
      reqItem = await CategoryDocumentRequirement.findOne({
        categoryId: expert.categoryId,
        docKey,
        status: 'ACTIVE'
      });
    }

    // Validate uploaded file
    const allowedFormats = reqItem ? reqItem.allowedFormats : ['pdf', 'jpg', 'jpeg', 'png'];
    const maxMb = reqItem ? reqItem.maxFileSizeMb : 5;
    const validation = validateUploadedFile(fileData, fileName, allowedFormats, maxMb);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Check if doc exists
    let doc = await ExpertDocument.findOne({ expertId, docKey });

    if (doc) {
      // Replace existing document
      doc.fileData = fileData;
      doc.fileName = fileName || doc.fileName || `${docKey}.${validation.fileType.split('/')[1] || 'pdf'}`;
      doc.fileType = validation.fileType;
      doc.fileSize = validation.fileSize;
      doc.status = 'PENDING';
      doc.rejectionReason = '';
      doc.uploadedAt = new Date();
      doc.history.push({
        action: 'REPLACED',
        status: 'PENDING',
        byRole: 'EXPERT',
        byId: expertId,
        createdAt: new Date()
      });
      await doc.save();
    } else {
      // Create new document
      doc = await ExpertDocument.create({
        expertId,
        requirementId: reqItem ? reqItem._id : null,
        docKey,
        docName: docName || reqItem?.name || docKey,
        description: reqItem?.description || '',
        fileName: fileName || `${docKey}.${validation.fileType.split('/')[1] || 'pdf'}`,
        fileType: validation.fileType,
        fileSize: validation.fileSize,
        fileData,
        isMandatory: reqItem ? reqItem.isMandatory : true,
        status: 'PENDING',
        uploadedAt: new Date(),
        history: [{
          action: 'UPLOADED',
          status: 'PENDING',
          byRole: 'EXPERT',
          byId: expertId,
          createdAt: new Date()
        }]
      });
    }

    // If expert's verificationStatus was REJECTED, reset to PENDING since new document was submitted
    if (expert.verificationStatus === 'REJECTED') {
      expert.verificationStatus = 'PENDING';
      await expert.save();
    }

    // Notify Administrator
    const io = req.app.get('io');
    sendNotification({
      recipientRole: 'ADMIN',
      recipientModel: 'Admin',
      title: 'Expert Document Uploaded',
      message: `Expert ${expert.name} uploaded/updated document "${doc.docName}" for verification.`,
      type: 'document_submitted',
      link: '/expert-applications',
      actionText: 'Review documents',
      badge: 'Review'
    }, io).catch(() => {});

    res.json({
      message: 'Document uploaded successfully and queued for admin review',
      document: {
        _id: doc._id,
        docKey: doc.docKey,
        docName: doc.docName,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
        uploadedAt: doc.uploadedAt
      }
    });
  } catch (error) {
    console.error('Expert document upload error:', error);
    res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
};

/**
 * @desc Admin Verify an Individual Document
 * @route PATCH /api/admin/experts/:expertId/documents/:documentId/verify
 * @access Admin
 */
exports.verifyExpertDocument = async (req, res) => {
  try {
    const { expertId, documentId } = req.params;

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const doc = await ExpertDocument.findOne({ _id: documentId, expertId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = 'VERIFIED';
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();
    doc.history.push({
      action: 'STATUS_CHANGE',
      status: 'VERIFIED',
      byRole: 'ADMIN',
      byId: req.user._id,
      createdAt: new Date()
    });
    await doc.save();

    // Real-time socket emission & notification to expert
    const io = req.app.get('io');
    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Document Verified',
      message: `Your document "${doc.docName}" has been verified and approved by Administrator.`,
      type: 'document_verified',
      badge: 'Verified',
      actionText: 'View status',
      link: '/expert/settings'
    }, io).catch(() => {});

    if (io) {
      io.to(`user_${expert._id}`).emit('document_status_changed', {
        documentId: doc._id,
        docKey: doc.docKey,
        status: 'VERIFIED',
        message: `Document "${doc.docName}" has been verified.`
      });
    }

    res.json({ message: `Document "${doc.docName}" marked as VERIFIED`, document: doc });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ message: 'Failed to verify document', error: error.message });
  }
};

/**
 * @desc Admin Reject an Individual Document
 * @route PATCH /api/admin/experts/:expertId/documents/:documentId/reject
 * @access Admin
 */
exports.rejectExpertDocument = async (req, res) => {
  try {
    const { expertId, documentId } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
    }

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const doc = await ExpertDocument.findOne({ _id: documentId, expertId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = 'REJECTED';
    doc.rejectionReason = reason.trim();
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();
    doc.history.push({
      action: 'STATUS_CHANGE',
      status: 'REJECTED',
      rejectionReason: reason.trim(),
      byRole: 'ADMIN',
      byId: req.user._id,
      createdAt: new Date()
    });
    await doc.save();

    // Real-time socket emission & notification to expert
    const io = req.app.get('io');
    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Document Verification Rejected',
      message: `Your document "${doc.docName}" was rejected: "${reason.trim()}". Please upload a valid document.`,
      type: 'document_rejected',
      badge: 'Alert',
      actionText: 'Update document',
      link: '/expert/settings'
    }, io).catch(() => {});

    if (io) {
      io.to(`user_${expert._id}`).emit('document_status_changed', {
        documentId: doc._id,
        docKey: doc.docKey,
        status: 'REJECTED',
        rejectionReason: reason.trim(),
        message: `Document "${doc.docName}" was rejected: "${reason.trim()}".`
      });
    }

    res.json({ message: `Document "${doc.docName}" marked as REJECTED`, document: doc });
  } catch (error) {
    console.error('Reject document error:', error);
    res.status(500).json({ message: 'Failed to reject document', error: error.message });
  }
};

/**
 * @desc Admin Request Re-upload for an Individual Document
 * @route PATCH /api/admin/experts/:expertId/documents/:documentId/request-reupload
 * @access Admin
 */
exports.requestDocumentReupload = async (req, res) => {
  try {
    const { expertId, documentId } = req.params;
    const { instructions } = req.body;

    if (!instructions || !instructions.trim()) {
      return res.status(400).json({ message: 'Instructions for re-upload are required.' });
    }

    const expert = await Expert.findById(expertId);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const doc = await ExpertDocument.findOne({ _id: documentId, expertId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.status = 'REUPLOAD_REQUIRED';
    doc.rejectionReason = instructions.trim();
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();
    doc.history.push({
      action: 'STATUS_CHANGE',
      status: 'REUPLOAD_REQUIRED',
      rejectionReason: instructions.trim(),
      byRole: 'ADMIN',
      byId: req.user._id,
      createdAt: new Date()
    });
    await doc.save();

    // Real-time socket emission & notification to expert
    const io = req.app.get('io');
    sendNotification({
      recipient: expert._id,
      recipientRole: 'EXPERT',
      recipientModel: 'Expert',
      title: 'Document Re-upload Required',
      message: `The Administrator requested a re-upload for "${doc.docName}": "${instructions.trim()}".`,
      type: 'document_reupload_required',
      badge: 'Action Required',
      actionText: 'Re-upload now',
      link: '/expert/settings'
    }, io).catch(() => {});

    if (io) {
      io.to(`user_${expert._id}`).emit('document_status_changed', {
        documentId: doc._id,
        docKey: doc.docKey,
        status: 'REUPLOAD_REQUIRED',
        rejectionReason: instructions.trim(),
        message: `Re-upload requested for "${doc.docName}": "${instructions.trim()}".`
      });
    }

    res.json({ message: `Re-upload requested for document "${doc.docName}"`, document: doc });
  } catch (error) {
    console.error('Request reupload error:', error);
    res.status(500).json({ message: 'Failed to request reupload', error: error.message });
  }
};

/**
 * @desc Admin Update Internal Notes for a Document
 * @route PATCH /api/admin/experts/:expertId/documents/:documentId/notes
 * @access Admin
 */
exports.updateDocumentAdminNotes = async (req, res) => {
  try {
    const { expertId, documentId } = req.params;
    const { adminNotes } = req.body;

    const doc = await ExpertDocument.findOne({ _id: documentId, expertId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.adminNotes = adminNotes !== undefined ? adminNotes.trim() : '';
    doc.history.push({
      action: 'NOTE_ADDED',
      adminNotes: doc.adminNotes,
      byRole: 'ADMIN',
      byId: req.user._id,
      createdAt: new Date()
    });
    await doc.save();

    res.json({ message: 'Admin notes saved successfully', document: doc });
  } catch (error) {
    console.error('Update notes error:', error);
    res.status(500).json({ message: 'Failed to update notes', error: error.message });
  }
};

/**
 * @desc Secure authenticated document stream/download endpoint
 * @route GET /api/documents/:documentId/file
 * @access Authenticated (Admin OR Owner Expert)
 */
exports.getDocumentFile = async (req, res) => {
  try {
    // Authenticate token from header or query param
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required to access private document.' });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }

    const doc = await ExpertDocument.findById(req.params.documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    // Role-based authorization: Only ADMIN or the owner EXPERT can view this document!
    const isAdmin = decoded.role === 'ADMIN';
    const isOwnerExpert = decoded.role === 'EXPERT' && decoded.id.toString() === doc.expertId.toString();

    if (!isAdmin && !isOwnerExpert) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to view this private document.' });
    }

    const fileData = doc.fileData;
    if (!fileData) {
      return res.status(404).json({ message: 'Document file content is empty.' });
    }

    // Extract mime type and base64 payload
    let mimeType = doc.fileType || 'application/octet-stream';
    let base64Content = fileData;

    if (fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Content = match[2];
      }
    }

    const fileBuffer = Buffer.from(base64Content, 'base64');
    const safeFileName = (doc.fileName || `${doc.docKey}.pdf`).replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Secure CSP & CORS: restrict framing and cross-origin reads strictly to authorized application origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://experthub.nextgoodtechnologies.in,http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',').map(s => s.trim());
    const requestOrigin = req.headers.origin || '';
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://experthub.nextgoodtechnologies.in http://localhost:5173 http://localhost:5174 http://localhost:3000");
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    res.send(fileBuffer);
  } catch (error) {
    console.error('Get document file error:', error);
    res.status(500).json({ message: 'Failed to stream document', error: error.message });
  }
};

