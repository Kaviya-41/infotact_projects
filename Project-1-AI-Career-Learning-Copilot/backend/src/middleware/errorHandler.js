/**
 * Error-handling middleware
 *
 * Catches any errors thrown (or passed via next(err)) in route handlers
 * and returns a consistent JSON error response.
 */

const errorHandler = (err, _req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(', ') || 'Validation error';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate key error';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
