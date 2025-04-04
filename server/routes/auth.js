const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Beta code verification route
 * POST /api/auth/verify-beta
 * 
 * Request body: { betaCode: string }
 * Response: JWT token if beta code is valid
 */
router.post('/verify-beta', (req, res) => {
  const { betaCode } = req.body;
  
  if (!betaCode) {
    return res.status(400).json({ 
      success: false, 
      message: 'Beta code is required' 
    });
  }
  
  // Check if beta code matches the one in environment variables
  if (betaCode === process.env.BETA_CODE) {
    // Create a JWT token
    const token = jwt.sign(
      { 
        isPaid: true,
        source: 'beta_code',
        issuedAt: new Date().toISOString()
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } // Beta access lasts 24 hours
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'Beta code verified successfully', 
      token 
    });
  }
  
  // Invalid beta code
  return res.status(400).json({ 
    success: false, 
    message: 'Invalid beta code' 
  });
});

/**
 * Validate token route
 * GET /api/auth/validate-token
 * 
 * This route is used to check if a token is valid
 * It will be used by the client to verify token status
 */
router.get('/validate-token', (req, res) => {
  const bearerHeader = req.headers['authorization'];
  
  if (!bearerHeader) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    // Extract the token
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Token is valid', 
      data: {
        isPaid: decoded.isPaid,
        source: decoded.source
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

module.exports = router; 