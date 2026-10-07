const mongoose = require('mongoose');

const expertServiceSchema = new mongoose.Schema({
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' },
  name: { type: String, required: true },
  description: { type: String, required: false, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  pricingType: { type: String, enum: ['Fixed', 'Per Minute'], default: 'Fixed' },
  duration: { type: Number, required: true }, // in minutes
  consultationType: { 
    type: String, 
    enum: ['Video', 'Audio', 'Chat', 'Video + Chat', 'Audio + Chat'], 
    required: true 
  },
  bookingType: { 
    type: String, 
    enum: ['Scheduled', 'Instant', 'Both'], 
    default: 'Scheduled' 
  },
  availabilityMode: { 
    type: String, 
    enum: ['Use Expert Schedule', 'Custom'], 
    default: 'Use Expert Schedule' 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], 
    default: 'ACTIVE' 
  },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }
}, { timestamps: true });

// Create indexes for commonly queried fields
expertServiceSchema.index({ expertId: 1, status: 1 });
expertServiceSchema.index({ categoryId: 1 });

module.exports = mongoose.model('ExpertService', expertServiceSchema);
