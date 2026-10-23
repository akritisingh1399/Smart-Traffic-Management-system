const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['trial', 'active', 'cancelled', 'expired', 'past_due'],
    default: 'trial'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'annual'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paypalSubscriptionId: {
    type: String,
    sparse: true
  },
  paypalOrderId: {
    type: String,
    sparse: true
  },
  trialEndsAt: {
    type: Date,
    default: function() {
      // 14 days from now
      return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: {
    type: Date
  },
  features: {
    maxIntersections: {
      type: Number,
      required: true
    },
    aiOptimization: {
      type: Boolean,
      default: false
    },
    predictiveAnalytics: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Number,
      default: 0
    },
    apiCallsPerDay: {
      type: Number,
      required: true
    },
    historicalDataDays: {
      type: Number,
      required: true
    },
    supportLevel: {
      type: String,
      enum: ['email', 'priority', '24/7'],
      default: 'email'
    },
    dedicatedAccountManager: {
      type: Boolean,
      default: false
    }
  },
  paymentHistory: [{
    amount: Number,
    status: String,
    paypalTransactionId: String,
    paidAt: Date,
    billingPeriod: String
  }]
}, {
  timestamps: true
});

// Index for quick lookups
subscriptionSchema.index({ userId: 1, status: 1 });

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' || 
         (this.status === 'trial' && new Date() < this.trialEndsAt);
};

// Method to check if in trial period
subscriptionSchema.methods.isInTrial = function() {
  return this.status === 'trial' && new Date() < this.trialEndsAt;
};

// Static method to get plan features
subscriptionSchema.statics.getPlanFeatures = function(planId) {
  const plans = {
    starter: {
      maxIntersections: 10,
      aiOptimization: false,
      predictiveAnalytics: false,
      customIntegrations: 0,
      apiCallsPerDay: 1000,
      historicalDataDays: 30,
      supportLevel: 'email',
      dedicatedAccountManager: false
    },
    professional: {
      maxIntersections: 50,
      aiOptimization: true,
      predictiveAnalytics: true,
      customIntegrations: 2,
      apiCallsPerDay: 10000,
      historicalDataDays: 365,
      supportLevel: 'priority',
      dedicatedAccountManager: false
    },
    enterprise: {
      maxIntersections: -1, // unlimited
      aiOptimization: true,
      predictiveAnalytics: true,
      customIntegrations: -1, // unlimited
      apiCallsPerDay: -1, // unlimited
      historicalDataDays: -1, // unlimited
      supportLevel: '24/7',
      dedicatedAccountManager: true
    }
  };
  
  return plans[planId] || plans.starter;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);