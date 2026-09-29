/**
 * Alert Controller
 *
 * Handles CRUD operations and filtering for fleet operational alerts.
 */

const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');

/** Helper to validate MongoDB ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Allowed severity levels */
const ALLOWED_SEVERITIES = ['critical', 'warning', 'info'];

/** Allowed alert statuses */
const ALLOWED_STATUSES = ['active', 'acknowledged', 'resolved'];

/** Helper to sanitize and normalize alert input data */
const sanitizeAlertData = (body) => {
  const data = { ...body };

  if (typeof data.type === 'string') {
    data.type = data.type.trim();
  }
  if (typeof data.message === 'string') {
    data.message = data.message.trim();
  }
  if (typeof data.severity === 'string') {
    data.severity = data.severity.toLowerCase().trim();
  }
  if (typeof data.status === 'string') {
    data.status = data.status.toLowerCase().trim();
  }

  // Support top-level latitude / longitude if provided
  if (data.latitude !== undefined || data.longitude !== undefined) {
    data.location = {
      latitude: data.latitude !== undefined ? Number(data.latitude) : data.location?.latitude || 0,
      longitude: data.longitude !== undefined ? Number(data.longitude) : data.location?.longitude || 0,
    };
  }

  return data;
};

// ---------------------------------------------------------------------------
// GET /api/alerts (Public)
// ---------------------------------------------------------------------------
const getAlerts = async (req, res, next) => {
  try {
    const { severity, status, vehicle, trip, type } = req.query;
    const filter = {};

    if (severity) {
      const normalizedSeverity = severity.toLowerCase().trim();
      if (!ALLOWED_SEVERITIES.includes(normalizedSeverity)) {
        return res.status(400).json({
          success: false,
          message: `Invalid severity filter '${severity}'. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
        });
      }
      filter.severity = normalizedSeverity;
    }

    if (status) {
      const normalizedStatus = status.toLowerCase().trim();
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter '${status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      filter.status = normalizedStatus;
    }

    if (vehicle) {
      if (!isValidObjectId(vehicle)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Vehicle ID format in filter query',
        });
      }
      filter.vehicle = vehicle;
    }

    if (trip) {
      if (!isValidObjectId(trip)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Trip ID format in filter query',
        });
      }
      filter.trip = trip;
    }

    if (type) {
      filter.type = type.trim();
    }

    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .populate('vehicle')
      .populate('trip');

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/alerts/:id (Public)
// ---------------------------------------------------------------------------
const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Alert ID format',
      });
    }

    const alert = await Alert.findById(id)
      .populate('vehicle')
      .populate('trip');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/alerts (Protected)
// ---------------------------------------------------------------------------
const createAlert = async (req, res, next) => {
  try {
    const alertData = sanitizeAlertData(req.body);

    // 1. Vehicle validation
    if (!alertData.vehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle reference is required',
      });
    }

    if (!isValidObjectId(alertData.vehicle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vehicle ID format',
      });
    }

    const vehicleObj = await Vehicle.findById(alertData.vehicle);
    if (!vehicleObj) {
      return res.status(404).json({
        success: false,
        message: 'Referenced vehicle does not exist',
      });
    }

    // 2. Trip validation (optional)
    if (alertData.trip) {
      if (!isValidObjectId(alertData.trip)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Trip ID format',
        });
      }
      const tripObj = await Trip.findById(alertData.trip);
      if (!tripObj) {
        return res.status(404).json({
          success: false,
          message: 'Referenced trip does not exist',
        });
      }
    }

    // 3. Required fields validation
    if (!alertData.type) {
      return res.status(400).json({
        success: false,
        message: 'Alert type is required',
      });
    }

    if (!alertData.message) {
      return res.status(400).json({
        success: false,
        message: 'Alert message is required',
      });
    }

    // 4. Severity validation
    if (alertData.severity && !ALLOWED_SEVERITIES.includes(alertData.severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity '${alertData.severity}'. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
      });
    }

    // 5. Status validation & resolvedAt logic
    if (alertData.status && !ALLOWED_STATUSES.includes(alertData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${alertData.status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    if (alertData.status === 'resolved' && !alertData.resolvedAt) {
      alertData.resolvedAt = new Date();
    }

    const alert = await Alert.create(alertData);
    await alert.populate('vehicle');
    if (alert.trip) {
      await alert.populate('trip');
    }

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/alerts/:id (Protected)
// ---------------------------------------------------------------------------
const updateAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Alert ID format',
      });
    }

    const updateData = sanitizeAlertData(req.body);

    // If updating vehicle reference
    if (updateData.vehicle) {
      if (!isValidObjectId(updateData.vehicle)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Vehicle ID format',
        });
      }
      const vehicleObj = await Vehicle.findById(updateData.vehicle);
      if (!vehicleObj) {
        return res.status(404).json({
          success: false,
          message: 'Referenced vehicle does not exist',
        });
      }
    }

    // If updating trip reference
    if (updateData.trip) {
      if (!isValidObjectId(updateData.trip)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Trip ID format',
        });
      }
      const tripObj = await Trip.findById(updateData.trip);
      if (!tripObj) {
        return res.status(404).json({
          success: false,
          message: 'Referenced trip does not exist',
        });
      }
    }

    // Severity validation
    if (updateData.severity && !ALLOWED_SEVERITIES.includes(updateData.severity)) {
      return res.status(400).json({
        success: false,
        message: `Invalid severity '${updateData.severity}'. Allowed values: ${ALLOWED_SEVERITIES.join(', ')}`,
      });
    }

    // Status validation
    if (updateData.status && !ALLOWED_STATUSES.includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${updateData.status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    // Handle resolvedAt based on status
    if (updateData.status === 'resolved') {
      if (!updateData.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    } else if (updateData.status === 'active' || updateData.status === 'acknowledged') {
      if (updateData.resolvedAt === undefined) {
        updateData.resolvedAt = null;
      }
    }

    const alert = await Alert.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('vehicle')
      .populate('trip');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert updated successfully',
      data: alert,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/alerts/:id (Protected)
// ---------------------------------------------------------------------------
const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Alert ID format',
      });
    }

    const alert = await Alert.findByIdAndDelete(id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
};
