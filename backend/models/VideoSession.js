const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true, index: true },
  status: { 
    type: String, 
    enum: ['SCHEDULED', 'USER_WAITING', 'EXPERT_JOINED', 'READY_TO_START', 'LIVE', 'USER_LEFT', 'EXPERT_LEFT', 'RECONNECTING', 'COMPLETED', 'CANCELLED', 'MISSED', 'FAILED'],
    default: 'SCHEDULED'
  },
  userJoinedAt: Date,
  expertJoinedAt: Date,
  startedAt: Date,
  endedAt: Date,
  actualDurationSeconds: { type: Number, default: 0 },
  userLastHeartbeat: Date,
  expertLastHeartbeat: Date
}, { timestamps: true });

module.exports = mongoose.model('VideoSession', videoSessionSchema);
