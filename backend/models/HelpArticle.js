const mongoose = require('mongoose');

const helpArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Account', 'Consultations', 'Payments', 'Wallet', 'Messages', 'Other']
  },
  content: {
    type: String,
    required: true
  },
  keywords: [{
    type: String
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  notHelpfulCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('HelpArticle', helpArticleSchema);
