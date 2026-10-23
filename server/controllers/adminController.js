const TrafficSignal = require('../models/TrafficSignal');
const LiveTraffic = require('../models/LiveTraffic');
const Alerts = require('../models/Alerts');
const User = require('../models/User');
const Reports = require('../models/Reports');
const bcrypt = require('bcryptjs');

exports.getAllSignals = async (req, res) => {
  try {
    const signals = await TrafficSignal.find();
    res.json(signals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSignal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const signal = await TrafficSignal.findByIdAndUpdate(id, updates, { new: true });
    if (!signal) {
      return res.status(404).json({ message: 'Signal not found' });
    }

    res.json({ message: 'Signal updated successfully', signal });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLiveCongestion = async (req, res) => {
  try {
    const congestionData = await LiveTraffic.find().sort({ timestamp: -1 }).limit(10);
    res.json(congestionData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alerts.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // Simple analytics - can be enhanced
    const totalSignals = await TrafficSignal.countDocuments();
    const activeSignals = await TrafficSignal.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();

    res.json({
      totalSignals,
      activeSignals,
      totalUsers,
      uptime: '99.9%' // Placeholder
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'User created successfully', user: { id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.exportReports = async (req, res) => {
  try {
    const reports = await Reports.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
