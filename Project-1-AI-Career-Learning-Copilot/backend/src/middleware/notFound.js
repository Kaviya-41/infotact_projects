/**
 * 404 handler for unknown API routes
 */

const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Not Found — ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFound;
