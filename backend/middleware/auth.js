const jwt = require('jsonwebtoken');

// ========================================================
// Authentication Middleware
// 1. Extracts the Bearer token from the 'Authorization' header
// 2. Verifies the token using the secret key (JWT_SECRET)
// 3. Attaches the decoded user data (including user id) to req.user
// ========================================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header is present and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No authentication token provided.',
    });
  }

  // Extract the token part after 'Bearer '
  const token = authHeader.split(' ')[1];

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach decoded user info (id, email) to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

module.exports = authenticate;
