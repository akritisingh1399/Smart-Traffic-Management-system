const Traffic = require("../models/traffic");
const TrafficSignal = require("../models/TrafficSignal");
const LiveTraffic = require("../models/LiveTraffic");
const Alert = require("../models/Alerts");

// Get all active traffic signals with live metrics
exports.getLiveTrafficStatus = async (req, res) => {
  try {
    const signals = await TrafficSignal.find({ status: 'active' }).sort({ congestionLevel: -1, location: 1 });
    res.json(signals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recent traffic alerts
exports.getPublicAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('signalId', 'location currentPhase timer congestionLevel')
      .sort({ createdAt: -1 })
      .limit(15);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get road congestion summary
exports.getRoadCongestion = async (req, res) => {
  try {
    const congestionData = await TrafficSignal.find({ status: 'active' })
      .select('location congestionLevel vehicleCount avgSpeed currentPhase timer coordinates latitude longitude');
    res.json(congestionData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Emergency Vehicle Preemption (EVP) toggle
exports.toggleEmergencyPreemption = async (req, res) => {
  try {
    const { id } = req.params;
    const signal = await TrafficSignal.findById(id);
    if (!signal) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    signal.emergencyOverride = !signal.emergencyOverride;
    if (signal.emergencyOverride) {
      signal.currentPhase = 'green';
      signal.timer = 90;
      const alert = await Alert.create({
        signalId: signal._id,
        message: `EMERGENCY VEHICLE PREEMPTION ACTIVATED: Green wave priority at ${signal.location}`,
        severity: 'critical'
      });
      if (req.app.get('io')) {
        req.app.get('io').emit('alertUpdate', alert);
      }
    } else {
      signal.timer = 45;
    }

    await signal.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('signalUpdate', signal);
    }

    res.json({
      success: true,
      message: signal.emergencyOverride ? 'Emergency priority active' : 'Emergency priority deactivated',
      signal
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Simulate rush hour surge across the network
exports.simulateRushHour = async (req, res) => {
  try {
    const signals = await TrafficSignal.find({ status: 'active' });
    const updatedSignals = [];

    for (const signal of signals) {
      // Simulate heavy rush volume increase
      const surge = Math.floor(Math.random() * 35) + 30;
      signal.vehicleCount = Math.min(130, signal.vehicleCount + surge);
      signal.congestionLevel = signal.vehicleCount > 60 ? 'high' : signal.vehicleCount > 30 ? 'medium' : 'low';
      
      // Dynamic green time optimization
      signal.timer = Math.min(90, Math.max(30, Math.floor(signal.vehicleCount * 0.85)));
      signal.avgSpeed = Math.max(8, Math.floor(65 - (signal.vehicleCount * 0.45)));
      await signal.save();
      updatedSignals.push(signal);
    }

    const rushAlert = await Alert.create({
      message: 'Peak Hour Rush detected: Adaptive green signal timings deployed citywide',
      severity: 'high'
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('signalsUpdate', updatedSignals);
      req.app.get('io').emit('alertUpdate', rushAlert);
    }

    res.json({ success: true, count: updatedSignals.length, signals: updatedSignals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AI/ML Predictive Traffic Forecast Endpoint
exports.getTrafficForecast = async (req, res) => {
  try {
    const hours = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM', '12 AM'];
    const currentHour = new Date().getHours();

    const forecast = hours.map((hourLabel, idx) => {
      const hr = (6 + idx * 2) % 24;
      const isPeakMorning = hr >= 7 && hr <= 9;
      const isPeakEvening = hr >= 16 && hr <= 19;
      const isNight = hr >= 22 || hr <= 5;

      let basePercentage = 45;
      if (isPeakMorning || isPeakEvening) {
        basePercentage = 85 + Math.floor(Math.random() * 10);
      } else if (isNight) {
        basePercentage = 18 + Math.floor(Math.random() * 8);
      } else {
        basePercentage = 50 + Math.floor(Math.random() * 12);
      }

      const predictedVehicles = Math.round(basePercentage * 16.5);
      const predictedIncidents = basePercentage > 75 ? Math.floor(basePercentage / 14) : Math.floor(basePercentage / 30);

      return {
        hour: hourLabel,
        hour24: hr,
        loadPercentage: basePercentage,
        vehicles: predictedVehicles,
        incidents: predictedIncidents,
        congestionCategory: basePercentage > 70 ? 'High' : basePercentage > 40 ? 'Medium' : 'Low'
      };
    });

    res.json({
      success: true,
      currentHour,
      forecast
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear alerts
exports.clearAlerts = async (req, res) => {
  try {
    await Alert.deleteMany({});
    if (req.app.get('io')) {
      req.app.get('io').emit('alertsCleared');
    }
    res.json({ success: true, message: 'All alerts cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Health check
exports.getHealth = async (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
};

// Legacy support
exports.addTrafficData = async (req, res) => {
  const { intersection, vehicleCount, avgSpeed } = req.body;
  const congestion = vehicleCount > 50 ? "High" : vehicleCount > 20 ? "Medium" : "Low";
  const record = await Traffic.create({ intersection, vehicleCount, avgSpeed, congestion });
  res.json(record);
};

exports.getTrafficData = async (req, res) => {
  const data = await Traffic.find().sort({ timestamp: -1 });
  res.json(data);
};
