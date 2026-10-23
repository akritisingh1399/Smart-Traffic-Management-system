const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'operator'],
    default: 'operator'
  },

  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null 
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'trial', 'active', 'cancelled', 'expired', 'past_due'],
    default: 'none' 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  strict: true,  
  versionKey: false, 
  minimize: false  
});



module.exports = mongoose.model('User', userSchema);