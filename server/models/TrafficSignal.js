const mongoose = require('mongoose');

const trafficSignalSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  timer: {
    type: Number, // in seconds
    default: 60
  },
  congestionLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  city: {
    type: String,
    default: 'London'
  },
  latitude: {
    type: Number,
    required: false
  },
  longitude: {
    type: Number,
    required: false
  },
  currentPhase: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'green'
  },
  vehicleCount: {
    type: Number,
    default: 25
  },
  avgSpeed: {
    type: Number,
    default: 35
  },
  emergencyOverride: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for liveTraffic
trafficSignalSchema.virtual('liveTraffic', {
  ref: 'LiveTraffic',
  localField: '_id',
  foreignField: 'signalId',
  justOne: true
});

module.exports = mongoose.model('TrafficSignal', trafficSignalSchema);

