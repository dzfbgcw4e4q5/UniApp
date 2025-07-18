const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth middleware - Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return res.status(401).send({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Auth middleware - Token:', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded user:', decoded);
    
    // Ensure user ID is a number
    if (decoded.id) {
      decoded.id = Number(decoded.id);
    }
    
    console.log('Auth middleware - Normalized user:', {
      id: decoded.id,
      role: decoded.role,
      idType: typeof decoded.id
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).send({ error: 'Please authenticate.', details: error.message });
  }
};

module.exports = auth;