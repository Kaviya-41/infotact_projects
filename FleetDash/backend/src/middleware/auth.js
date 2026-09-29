/**
 * Authentication Middleware
 *
 * Verifies the JWT from the Authorization header and attaches the
 * authenticated user's ID to req.user.
 *
 * Usage:
 *   router.get('/protected', auth, handler);
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = (req, res, next) => {
  // --- Read token from header ----------------------------------------------
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied — no token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  // --- Verify token --------------------------------------------------------
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired'
        : 'Invalid token';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = auth;
