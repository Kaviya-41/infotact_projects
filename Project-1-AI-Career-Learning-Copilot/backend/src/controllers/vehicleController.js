/**
 * Vehicle Controller
 *
 * Handles CRUD operations for fleet vehicles.
 */

const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

/** Helper to validate MongoDB ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Helper to adapt request body to Vehicle schema */
const sanitizeVehicleData = (body) => {
  const data = { ...body };

  // Map vehicleNumber -> vehicleId if vehicleId is omitted
  if (!data.vehicleId && data.vehicleNumber) {
    data.vehicleId = data.vehicleNumber;
  }

  // Map registrationNumber if missing
  if (!data.registrationNumber && data.vehicleId) {
    data.registrationNumber = data.vehicleId;
  }

  // Map speed -> currentSpeed if currentSpeed is omitted
  if (data.speed !== undefined && data.currentSpeed === undefined) {
    data.currentSpeed = Number(data.speed);
  }

  // Map top-level latitude/longitude into location object
  if (data.latitude !== undefined || data.longitude !== undefined) {
    data.location = {
      latitude: data.latitude !== undefined ? Number(data.latitude) : data.location?.latitude || 0,
      longitude: data.longitude !== undefined ? Number(data.longitude) : data.location?.longitude || 0,
    };
  }

  // Normalize enums to lowercase
  if (typeof data.type === 'string') {
    data.type = data.type.toLowerCase();
  }
  if (typeof data.status === 'string') {
    data.status = data.status.toLowerCase();
  }

  return data;
};

// ---------------------------------------------------------------------------
// GET /api/vehicles
// ---------------------------------------------------------------------------
const getVehicles = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toLowerCase();
    }
    if (type) {
      filter.type = type.toLowerCase();
    }
    if (search) {
      filter.$or = [
        { vehicleId: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/vehicles/:id
// ---------------------------------------------------------------------------
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vehicle ID format',
      });
    }

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/vehicles (Protected)
// ---------------------------------------------------------------------------
const createVehicle = async (req, res, next) => {
  try {
    const vehicleData = sanitizeVehicleData(req.body);

    // Validation
    if (!vehicleData.vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'vehicleId (or vehicleNumber) is required',
      });
    }

    if (!vehicleData.model) {
      return res.status(400).json({
        success: false,
        message: 'model is required',
      });
    }

    // Check for duplicates
    const existing = await Vehicle.findOne({
      $or: [
        { vehicleId: vehicleData.vehicleId },
        { registrationNumber: vehicleData.registrationNumber },
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Vehicle with ID '${vehicleData.vehicleId}' or registration '${vehicleData.registrationNumber}' already exists`,
      });
    }

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this identifier already exists',
      });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/vehicles/:id (Protected)
// ---------------------------------------------------------------------------
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vehicle ID format',
      });
    }

    const updateData = sanitizeVehicleData(req.body);
    updateData.lastUpdated = new Date();

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle identifier conflict during update',
      });
    }
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/vehicles/:id (Protected)
// ---------------------------------------------------------------------------
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vehicle ID format',
      });
    }

    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
