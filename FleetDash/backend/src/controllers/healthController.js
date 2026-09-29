/**
 * Health-check controller
 */

const getHealth = (_req, res) => {
  res.json({
    success: true,
    message: 'FleetDash backend is running',
  });
};

module.exports = { getHealth };
