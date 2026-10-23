const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  signalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrafficSignal',
    required: false
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Alert', alertSchema);
