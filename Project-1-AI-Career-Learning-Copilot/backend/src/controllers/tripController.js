/**
 * Trip Controller
 *
 * Handles CRUD operations for fleet trips.
 */

const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');

/** Helper to validate MongoDB ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Helper to validate date string or object */
const isValidDate = (val) => {
  if (val === undefined || val === null || val === '') return true;
  const d = new Date(val);
  return d instanceof Date && !isNaN(d.getTime());
};

/** Allowed trip statuses according to Trip model */
const ALLOWED_STATUSES = ['planned', 'active', 'completed', 'cancelled'];

/** Helper to sanitize and normalize request body */
const sanitizeTripData = (body) => {
  const data = { ...body };

  if (typeof data.driverName === 'string') {
    data.driverName = data.driverName.trim();
  }
  if (typeof data.origin === 'string') {
    data.origin = data.origin.trim();
  }
  if (typeof data.destination === 'string') {
    data.destination = data.destination.trim();
  }
  if (typeof data.status === 'string') {
    data.status = data.status.toLowerCase().trim();
  }
  if (data.distance !== undefined && data.distance !== null) {
    data.distance = Number(data.distance);
  }

  // Handle location coordinates if provided at top-level
  if (data.latitude !== undefined || data.longitude !== undefined) {
    data.currentLocation = {
      latitude: data.latitude !== undefined ? Number(data.latitude) : data.currentLocation?.latitude || 0,
      longitude: data.longitude !== undefined ? Number(data.longitude) : data.currentLocation?.longitude || 0,
    };
  }

  return data;
};

// ---------------------------------------------------------------------------
// GET /api/trips (Public)
// ---------------------------------------------------------------------------
const getTrips = async (req, res, next) => {
  try {
    const { status, vehicle } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toLowerCase();
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

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .populate('vehicle');

    res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/trips/:id (Public)
// ---------------------------------------------------------------------------
const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Trip ID format',
      });
    }

    const trip = await Trip.findById(id).populate('vehicle');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/trips (Protected)
// ---------------------------------------------------------------------------
const createTrip = async (req, res, next) => {
  try {
    const tripData = sanitizeTripData(req.body);

    // 1. Vehicle reference validation
    if (!tripData.vehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle reference is required',
      });
    }

    if (!isValidObjectId(tripData.vehicle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vehicle ID format',
      });
    }

    const vehicleObj = await Vehicle.findById(tripData.vehicle);
    if (!vehicleObj) {
      return res.status(404).json({
        success: false,
        message: 'Referenced vehicle does not exist',
      });
    }

    // 2. Driver name fallback if missing
    if (!tripData.driverName) {
      tripData.driverName = vehicleObj.driverName || 'Unassigned Driver';
    }

    // 3. Required fields validation
    if (!tripData.origin) {
      return res.status(400).json({
        success: false,
        message: 'Origin is required',
      });
    }

    if (!tripData.destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required',
      });
    }

    // 4. Status validation
    if (tripData.status && !ALLOWED_STATUSES.includes(tripData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid trip status '${tripData.status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    // 5. Date validation
    if (!isValidDate(tripData.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime format',
      });
    }

    if (!isValidDate(tripData.estimatedArrival)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid estimatedArrival format',
      });
    }

    if (!isValidDate(tripData.actualArrival)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actualArrival format',
      });
    }

    // 6. Distance validation
    if (tripData.distance !== undefined && (isNaN(tripData.distance) || tripData.distance < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Distance must be a non-negative number',
      });
    }

    const trip = await Trip.create(tripData);
    await trip.populate('vehicle');

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: trip,
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
// PUT /api/trips/:id (Protected)
// ---------------------------------------------------------------------------
const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Trip ID format',
      });
    }

    const updateData = sanitizeTripData(req.body);

    // If updating vehicle reference, verify it exists
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

    // Status validation
    if (updateData.status && !ALLOWED_STATUSES.includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid trip status '${updateData.status}'. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    // Date validation
    if (updateData.startTime !== undefined && !isValidDate(updateData.startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime format',
      });
    }

    if (updateData.estimatedArrival !== undefined && !isValidDate(updateData.estimatedArrival)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid estimatedArrival format',
      });
    }

    if (updateData.actualArrival !== undefined && !isValidDate(updateData.actualArrival)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid actualArrival format',
      });
    }

    // Distance validation
    if (updateData.distance !== undefined && (isNaN(updateData.distance) || updateData.distance < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Distance must be a non-negative number',
      });
    }

    const trip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('vehicle');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    res.json({
      success: true,
      message: 'Trip updated successfully',
      data: trip,
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
// DELETE /api/trips/:id (Protected)
// ---------------------------------------------------------------------------
const deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Trip ID format',
      });
    }

    const trip = await Trip.findByIdAndDelete(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    res.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
};
