const mongoose = require('mongoose');

const razorpayWebhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true,
  },
  accountCode: {
    type: String,
    enum: ['RAZORPAY_1', 'RAZORPAY_2', 'RAZORPAY_3', 'UNKNOWN'],
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  entityId: {
    type: String, // order_id, payment_id, or payout_id
  },
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['PROCESSED', 'IGNORED', 'FAILED'],
    default: 'PROCESSED',
  },
  error: {
    type: String,
  }
}, { timestamps: true });

// Composite unique index to guarantee an event is never processed more than once per account
razorpayWebhookEventSchema.index({ eventId: 1, accountCode: 1 }, { unique: true });

module.exports = mongoose.model('RazorpayWebhookEvent', razorpayWebhookEventSchema);

