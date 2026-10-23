const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Create subscription after PayPal payment
exports.createSubscription = async (req, res) => {
  try {
    const { 
      planId, 
      planName, 
      billingCycle, 
      amount, 
      paypalOrderId,
      paypalSubscriptionId 
    } = req.body;
    
    const userId = req.user.userId;

    // Check if user already has active subscription
    const existingSubscription = await Subscription.findOne({
      userId,
      status: { $in: ['trial', 'active'] }
    });

    if (existingSubscription) {
      return res.status(400).json({ 
        message: 'You already have an active subscription' 
      });
    }

    // Calculate period end date
    const currentPeriodEnd = new Date();
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Get plan features
    const features = Subscription.getPlanFeatures(planId);

    // Create subscription
    const subscription = new Subscription({
      userId,
      planId,
      planName,
      billingCycle,
      amount,
      paypalOrderId,
      paypalSubscriptionId,
      currentPeriodEnd,
      features,
      paymentHistory: [{
        amount,
        status: 'completed',
        paypalTransactionId: paypalOrderId,
        paidAt: new Date(),
        billingPeriod: billingCycle
      }]
    });

    await subscription.save();

    // Update user with subscription info
    await User.findByIdAndUpdate(userId, {
      subscriptionId: subscription._id,
      subscriptionStatus: 'trial'
    });

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscription._id,
        planName: subscription.planName,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        features: subscription.features
      }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to create subscription',
      error: error.message 
    });
  }
};

// Get user's current subscription
exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'No subscription found' 
      });
    }

    res.json({
      subscription: {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        isActive: subscription.isActive(),
        isInTrial: subscription.isInTrial(),
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        features: subscription.features,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve subscription',
      error: error.message 
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { immediate } = req.body; // Cancel immediately or at period end

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['trial', 'active'] }
    });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'No active subscription found' 
      });
    }

    if (immediate) {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    await subscription.save();

    // Update user
    await User.findByIdAndUpdate(userId, {
      subscriptionStatus: immediate ? 'cancelled' : 'active'
    });

    res.json({
      message: immediate 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at period end',
      subscription: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to cancel subscription',
      error: error.message 
    });
  }
};

// Upgrade/Downgrade subscription
exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newPlanId, billingCycle } = req.body;

    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['trial', 'active'] }
    });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'No active subscription found' 
      });
    }

    // Get new plan details
    const plans = {
      starter: { name: 'Starter', monthlyPrice: 499, annualPrice: 4990 },
      professional: { name: 'Professional', monthlyPrice: 1499, annualPrice: 14990 },
      enterprise: { name: 'Enterprise', monthlyPrice: 4999, annualPrice: 49990 }
    };

    const newPlan = plans[newPlanId];
    const newAmount = billingCycle === 'monthly' 
      ? newPlan.monthlyPrice 
      : newPlan.annualPrice;

    // Update subscription
    subscription.planId = newPlanId;
    subscription.planName = newPlan.name;
    subscription.billingCycle = billingCycle;
    subscription.amount = newAmount;
    subscription.features = Subscription.getPlanFeatures(newPlanId);

    await subscription.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        planName: subscription.planName,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        features: subscription.features
      }
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ 
      message: 'Failed to update subscription',
      error: error.message 
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const subscription = await Subscription.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'No subscription found' 
      });
    }

    res.json({
      paymentHistory: subscription.paymentHistory
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve payment history',
      error: error.message 
    });
  }
};

// Webhook handler for PayPal events
exports.handlePayPalWebhook = async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature here (implement PayPal signature verification)
    
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        // Handle successful payment
        await handlePaymentCompleted(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Handle subscription cancellation
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        // Handle subscription suspension (failed payment)
        await handleSubscriptionSuspended(event);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event_type);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
};

// Helper functions
async function handlePaymentCompleted(event) {
  // Extract subscription ID from event
  const subscriptionId = event.resource.billing_agreement_id;
  
  const subscription = await Subscription.findOne({ paypalSubscriptionId: subscriptionId });
  
  if (subscription) {
    // Add payment to history
    subscription.paymentHistory.push({
      amount: parseFloat(event.resource.amount.total),
      status: 'completed',
      paypalTransactionId: event.resource.id,
      paidAt: new Date(event.resource.create_time),
      billingPeriod: subscription.billingCycle
    });
    
    // Update status if in trial
    if (subscription.status === 'trial') {
      subscription.status = 'active';
    }
    
    await subscription.save();
  }
}

async function handleSubscriptionCancelled(event) {
  const subscriptionId = event.resource.id;
  
  const subscription = await Subscription.findOne({ paypalSubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();
    
    // Update user
    await User.findByIdAndUpdate(subscription.userId, {
      subscriptionStatus: 'cancelled'
    });
  }
}

async function handleSubscriptionSuspended(event) {
  const subscriptionId = event.resource.id;
  
  const subscription = await Subscription.findOne({ paypalSubscriptionId: subscriptionId });
  
  if (subscription) {
    subscription.status = 'past_due';
    await subscription.save();
    
    // Update user
    await User.findByIdAndUpdate(subscription.userId, {
      subscriptionStatus: 'past_due'
    });
  }
}

module.exports = exports;