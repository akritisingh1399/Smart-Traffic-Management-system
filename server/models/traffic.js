const mongoose = require("mongoose");

const TrafficSchema = new mongoose.Schema({
  intersection: String,
  vehicleCount: Number,
  avgSpeed: Number,
  congestion: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Traffic", TrafficSchema);