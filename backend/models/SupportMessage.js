const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SupportTicket',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Admin', 'Expert']
  },
  message: {
    type: String,
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachment: {
    url: String,
    fileType: String,
    fileName: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
