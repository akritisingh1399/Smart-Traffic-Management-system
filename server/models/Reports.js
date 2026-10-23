const mongoose = require('mongoose');

const reportsSchema = new mongoose.Schema({
  dailyAvg: {
    type: Number,
    required: true
  },
  peakHours: {
    type: [String],
    required: true
  },
  stats: {
    type: Object,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reports', reportsSchema);
