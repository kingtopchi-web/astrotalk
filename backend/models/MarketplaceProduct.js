const mongoose = require('mongoose');

const marketplaceProductSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  terms: {
    type: String,
    default: 'Standard personal and commercial license. Redistribution or resale of the original source files is strictly prohibited.'
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be positive']
  },
  discountedPrice: {
    type: Number,
    default: null
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceCategory',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  coverImage: {
    type: String,
    required: true
  },
  previewImages: [{
    type: String
  }],
  previewFile: {
    originalName: { type: String },
    storedFileName: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number },
    fileUrl: { type: String }
  },
  // Private digital file - NEVER exposed to public!
  digitalFile: {
    originalName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true }, // bytes
    fileExtension: { type: String, required: true }
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sellerModel'
  },
  sellerModel: {
    type: String,
    required: true,
    enum: ['User', 'Expert']
  },
  sellerName: {
    type: String,
    required: true
  },
  sellerEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    default: 'PENDING'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  salesCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  copyrightConfirmed: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

marketplaceProductSchema.index({ status: 1, category: 1, isFeatured: 1 });
marketplaceProductSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MarketplaceProduct', marketplaceProductSchema);

