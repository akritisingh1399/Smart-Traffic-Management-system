const mongoose = require('mongoose');

const liveTrafficSchema = new mongoose.Schema({
  signalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrafficSignal',
    required: true
  },
  vehicleCount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Ensure only one live traffic record per signal
liveTrafficSchema.index({ signalId: 1 }, { unique: true });

module.exports = mongoose.model('LiveTraffic', liveTrafficSchema);
