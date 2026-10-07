const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
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
    enum: ['User', 'Expert', 'Admin']
  },
  text: {
    type: String
  },
  attachment: {
    url: String,
    fileType: String,
    fileName: String
  },
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'READ'],
    default: 'SENT'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
