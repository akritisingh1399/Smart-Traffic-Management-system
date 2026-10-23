const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {

    const authHeader = req.header('Authorization');
    
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Authorization Header:', authHeader ? 'Present' : 'Missing');
    console.log('Full Headers:', JSON.stringify(req.headers, null, 2));
    
    if (!authHeader) {
      console.log('ERROR: No Authorization header');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    if (!authHeader.startsWith('Bearer ')) {
      console.log('ERROR: Invalid token format (missing Bearer prefix)');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('Token length:', token.length);
    
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    console.log('Using JWT Secret:', jwtSecret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, jwtSecret);
    
    console.log('Token decoded successfully:', {
      userId: decoded.userId,
      role: decoded.role,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'no expiry'
    });
    
    req.user = decoded;
    console.log('=== AUTH SUCCESS ===\n');
    next();
  } catch (err) {
    console.log('=== AUTH FAILED ===');
    console.log('Error type:', err.name);
    console.log('Error message:', err.message);
    console.log('Full error:', err);
    console.log('==================\n');
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role '${req.user.role}' not in allowed roles:`, roles);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log(`Authorization success: User role '${req.user.role}' is allowed`);
    next();
  };
};

module.exports = { auth, authorize };