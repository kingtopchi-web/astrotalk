const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'participants.participantModel',
      required: true
    },
    participantModel: {
      type: String,
      required: true,
      enum: ['User', 'Expert', 'Admin']
    }
  }],
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  lastMessage: {
    type: String
  },
  lastMessageAt: {
    type: Date
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
