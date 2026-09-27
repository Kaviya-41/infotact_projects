/**
 * Vehicle Model
 *
 * Represents a fleet vehicle with telemetry data (location, speed, fuel, status, mileage, maintenance).
 */

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    make: {
      type: String,
      trim: true,
      default: 'Generic',
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      min: 1900,
      max: 2100,
    },
    type: {
      type: String,
      enum: ['truck', 'van', 'car', 'bus', 'motorcycle', 'other'],
      default: 'truck',
      lowercase: true,
    },
    driverName: {
      type: String,
      trim: true,
      default: '',
    },
    driverPhone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance'],
      default: 'offline',
      lowercase: true,
    },
    fuelLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    currentSpeed: {
      type: Number,
      min: 0,
      default: 0,
    },
    mileage: {
      type: Number,
      min: 0,
      default: 0,
    },
    maintenanceNotes: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: 0,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: 0,
      },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---------------------------------------------------------------------------
// Virtuals for flat access matching frontend BackendVehicle structure
// ---------------------------------------------------------------------------
vehicleSchema.virtual('speed').get(function () {
  return this.currentSpeed;
});

vehicleSchema.virtual('latitude').get(function () {
  return this.location ? this.location.latitude : 0;
});

vehicleSchema.virtual('longitude').get(function () {
  return this.location ? this.location.longitude : 0;
});

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });
// vehicleId and registrationNumber indexes created automatically by unique: true

// ---------------------------------------------------------------------------
// toJSON transform
// ---------------------------------------------------------------------------
vehicleSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
