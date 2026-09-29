/**
 * Alert Model
 *
 * Represents a fleet operational alert (speeding, fuel, geofence, etc.),
 * linked to a Vehicle and optionally to a Trip.
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      trim: true,
      // e.g. 'speeding', 'low_fuel', 'geofence', 'idle', 'maintenance'
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'info',
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
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
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ vehicle: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ createdAt: -1 });

// ---------------------------------------------------------------------------
// toJSON transform
// ---------------------------------------------------------------------------
alertSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Alert', alertSchema);
