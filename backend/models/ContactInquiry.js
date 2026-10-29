const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    default: 'General Contact Inquiry',
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'SPAM'],
    default: 'PENDING'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  replyMessage: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

contactInquirySchema.index({ createdAt: -1 });
contactInquirySchema.index({ status: 1 });
contactInquirySchema.index({ email: 1 });

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);

