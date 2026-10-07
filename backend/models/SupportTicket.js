const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Expert'],
    default: 'User'
  },
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Account', 'Consultations', 'Payments', 'Wallet', 'Messages', 'Other']
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  attachment: {
    url: String,
    fileType: String,
    fileName: String
  }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
