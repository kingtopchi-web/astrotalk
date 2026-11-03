const mongoose = require('mongoose');

const categoryDocumentRequirementSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    default: null,
    index: true
  },
  docKey: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isMandatory: {
    type: Boolean,
    default: true
  },
  allowedFormats: {
    type: [String],
    default: ['pdf', 'jpg', 'jpeg', 'png']
  },
  maxFileSizeMb: {
    type: Number,
    default: 5,
    min: 1,
    max: 25
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

categoryDocumentRequirementSchema.index({ categoryId: 1, subCategoryId: 1, docKey: 1 });

module.exports = mongoose.model('CategoryDocumentRequirement', categoryDocumentRequirementSchema);

