const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
    unique: true // Exactly one review per consultation at DB index level
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer rating'
    }
  },
  feedback: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['PUBLISHED', 'HIDDEN', 'FLAGGED'],
    default: 'PUBLISHED'
  }
}, {
  timestamps: true
});

// Index to efficiently query expert's published reviews
reviewSchema.index({ expert: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
