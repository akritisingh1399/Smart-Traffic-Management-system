const { body } = require('express-validator');

const validateRegister = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['admin', 'operator']).withMessage('Role must be admin or operator')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateTrafficSignal = [
  body('location').notEmpty().withMessage('Location is required'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status'),
  body('timer').optional().isInt({ min: 1 }).withMessage('Timer must be a positive integer'),
  body('congestionLevel').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid congestion level')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTrafficSignal
};
