const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT tokens
 * This will be used to protect routes that require payment verification
 */
const verifyToken = (req, res, next) => {
  // Get the token from the Authorization header
  const bearerHeader = req.headers['authorization'];
  
  if (!bearerHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Extract the token from the Bearer string
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add the decoded token to the request
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

module.exports = { verifyToken }; 