/**
 * Dashboard Controller
 *
 * Provides aggregated fleet statistics from the Vehicle, Trip, and Alert
 * collections.  Every number is calculated from live MongoDB data —
 * nothing is hardcoded.
 */

const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Alert = require('../models/Alert');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Max allowed limit for "recent" queries. */
const MAX_LIMIT = 50;

/** Parse and validate the ?limit query param (defaults to 5, max MAX_LIMIT). */
const parseLimit = (raw) => {
  if (raw === undefined || raw === null || raw === '') return 5;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return null; // signals invalid
  return Math.min(n, MAX_LIMIT);
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/summary
// ---------------------------------------------------------------------------
const getSummary = async (_req, res, next) => {
  try {
    const [
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      maintenanceVehicles,
      totalTrips,
      activeTrips,
      completedTrips,
      plannedTrips,
      cancelledTrips,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
    ] = await Promise.all([
      // --- Vehicles ---
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'online' }),
      Vehicle.countDocuments({ status: 'offline' }),
      Vehicle.countDocuments({ status: 'maintenance' }),
      // --- Trips ---
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'active' }),
      Trip.countDocuments({ status: 'completed' }),
      Trip.countDocuments({ status: 'planned' }),
      Trip.countDocuments({ status: 'cancelled' }),
      // --- Alerts ---
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ severity: 'critical' }),
      Alert.countDocuments({ severity: 'warning' }),
      Alert.countDocuments({ severity: 'info' }),
    ]);

    res.json({
      success: true,
      data: {
        totalVehicles,
        activeVehicles: onlineVehicles,
        inactiveVehicles: offlineVehicles + maintenanceVehicles,
        onlineVehicles,
        offlineVehicles,
        maintenanceVehicles,
        totalTrips,
        activeTrips,
        completedTrips,
        plannedTrips,
        cancelledTrips,
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        warningAlerts,
        infoAlerts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/vehicle-status
// ---------------------------------------------------------------------------
const getVehicleStatus = async (_req, res, next) => {
  try {
    const results = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const data = results.map((r) => ({ status: r._id, count: r.count }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/trip-status
// ---------------------------------------------------------------------------
const getTripStatus = async (_req, res, next) => {
  try {
    const results = await Trip.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const data = results.map((r) => ({ status: r._id, count: r.count }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/alert-summary
// ---------------------------------------------------------------------------
const getAlertSummary = async (_req, res, next) => {
  try {
    const [bySeverityRaw, byStatusRaw] = await Promise.all([
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        bySeverity: bySeverityRaw.map((r) => ({ severity: r._id, count: r.count })),
        byStatus: byStatusRaw.map((r) => ({ status: r._id, count: r.count })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/recent-alerts
// ---------------------------------------------------------------------------
const getRecentAlerts = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    if (limit === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid limit — must be a positive integer (max ${MAX_LIMIT})`,
      });
    }

    const alerts = await Alert.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('vehicle')
      .populate('trip');

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/recent-trips
// ---------------------------------------------------------------------------
const getRecentTrips = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    if (limit === null) {
      return res.status(400).json({
        success: false,
        message: `Invalid limit — must be a positive integer (max ${MAX_LIMIT})`,
      });
    }

    const trips = await Trip.find()
      .sort({ startTime: -1, createdAt: -1 })
      .limit(limit)
      .populate('vehicle');

    res.json({ success: true, count: trips.length, data: trips });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/dashboard/overview
// ---------------------------------------------------------------------------
const getOverview = async (req, res, next) => {
  try {
    const recentLimit = parseLimit(req.query.limit) || 5;

    // --- Run all queries concurrently ---------------------------------------
    const [
      // Vehicle counts
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      maintenanceVehicles,

      // Trip counts
      totalTrips,
      activeTrips,
      completedTrips,
      plannedTrips,
      cancelledTrips,

      // Alert counts
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,

      // Aggregations
      vehicleStatusAgg,
      tripStatusAgg,
      alertBySeverityAgg,
      alertByStatusAgg,

      // Recent data
      recentAlerts,
      recentTrips,
    ] = await Promise.all([
      // --- Vehicles ---
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'online' }),
      Vehicle.countDocuments({ status: 'offline' }),
      Vehicle.countDocuments({ status: 'maintenance' }),

      // --- Trips ---
      Trip.countDocuments(),
      Trip.countDocuments({ status: 'active' }),
      Trip.countDocuments({ status: 'completed' }),
      Trip.countDocuments({ status: 'planned' }),
      Trip.countDocuments({ status: 'cancelled' }),

      // --- Alerts ---
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ severity: 'critical' }),
      Alert.countDocuments({ severity: 'warning' }),
      Alert.countDocuments({ severity: 'info' }),

      // --- Aggregations ---
      Vehicle.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Trip.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // --- Recent ---
      Alert.find()
        .sort({ createdAt: -1 })
        .limit(recentLimit)
        .populate('vehicle')
        .populate('trip'),
      Trip.find()
        .sort({ startTime: -1, createdAt: -1 })
        .limit(recentLimit)
        .populate('vehicle'),
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalVehicles,
          activeVehicles: onlineVehicles,
          inactiveVehicles: offlineVehicles + maintenanceVehicles,
          onlineVehicles,
          offlineVehicles,
          maintenanceVehicles,
          totalTrips,
          activeTrips,
          completedTrips,
          plannedTrips,
          cancelledTrips,
          totalAlerts,
          activeAlerts,
          criticalAlerts,
          warningAlerts,
          infoAlerts,
        },
        vehicleStatus: vehicleStatusAgg.map((r) => ({ status: r._id, count: r.count })),
        tripStatus: tripStatusAgg.map((r) => ({ status: r._id, count: r.count })),
        alertSummary: {
          bySeverity: alertBySeverityAgg.map((r) => ({ severity: r._id, count: r.count })),
          byStatus: alertByStatusAgg.map((r) => ({ status: r._id, count: r.count })),
        },
        recentAlerts,
        recentTrips,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getVehicleStatus,
  getTripStatus,
  getAlertSummary,
  getRecentAlerts,
  getRecentTrips,
  getOverview,
};
