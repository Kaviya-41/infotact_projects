/**
 * Dashboard Routes
 *
 * Base Path: /api/dashboard
 *
 * All dashboard endpoints are protected by JWT authentication.
 *
 * GET /api/dashboard/summary        — Fleet KPI summary
 * GET /api/dashboard/vehicle-status  — Vehicle counts by status
 * GET /api/dashboard/trip-status     — Trip counts by status
 * GET /api/dashboard/alert-summary   — Alert counts by severity & status
 * GET /api/dashboard/recent-alerts   — Most recent alerts
 * GET /api/dashboard/recent-trips    — Most recent trips
 * GET /api/dashboard/overview        — Combined overview of all above
 */

const { Router } = require('express');
const {
  getSummary,
  getVehicleStatus,
  getTripStatus,
  getAlertSummary,
  getRecentAlerts,
  getRecentTrips,
  getOverview,
} = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/summary', auth, getSummary);
router.get('/vehicle-status', auth, getVehicleStatus);
router.get('/trip-status', auth, getTripStatus);
router.get('/alert-summary', auth, getAlertSummary);
router.get('/recent-alerts', auth, getRecentAlerts);
router.get('/recent-trips', auth, getRecentTrips);
router.get('/overview', auth, getOverview);

module.exports = router;
