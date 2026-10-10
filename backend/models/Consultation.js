const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertService',
    required: false,
  },
  type: {
    type: String,
    enum: ['call', 'chat', 'video', 'audio'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  startTime: {
    type: Date,
    required: true,
  },
  durationInMinutes: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  expertEarning: {
    type: Number,
    default: 0
  },
  platformFee: {
    type: Number,
    default: 0
  },
  meetingLink: {
    type: String, // e.g. a dynamic room URL for video calls
  }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
