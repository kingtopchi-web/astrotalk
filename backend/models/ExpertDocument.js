const mongoose = require('mongoose');

const expertDocumentSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true,
    index: true
  },
  requirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryDocumentRequirement',
    default: null
  },
  docKey: {
    type: String,
    required: true,
    trim: true
  },
  docName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: '' // 'application/pdf', 'image/jpeg', etc.
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileData: {
    type: String, // Base64 data URI or secure storage URL
    required: true
  },
  isMandatory: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REUPLOAD_REQUIRED'],
    default: 'PENDING',
    index: true
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  adminNotes: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  history: [{
    action: {
      type: String,
      enum: ['UPLOADED', 'REPLACED', 'STATUS_CHANGE', 'NOTE_ADDED'],
      default: 'UPLOADED'
    },
    status: String,
    rejectionReason: String,
    adminNotes: String,
    byRole: {
      type: String,
      enum: ['EXPERT', 'ADMIN', 'SYSTEM'],
      default: 'EXPERT'
    },
    byId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

expertDocumentSchema.index({ expertId: 1, docKey: 1 });

module.exports = mongoose.model('ExpertDocument', expertDocumentSchema);

