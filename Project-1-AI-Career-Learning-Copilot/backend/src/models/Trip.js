/**
 * Trip Model
 *
 * Represents a fleet trip from origin to destination,
 * linked to a Vehicle via ObjectId reference.
 */

const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed', 'cancelled'],
      default: 'planned',
    },
    startTime: {
      type: Date,
    },
    estimatedArrival: {
      type: Date,
    },
    actualArrival: {
      type: Date,
    },
    distance: {
      type: Number, // in kilometres
      min: 0,
      default: 0,
    },
    currentLocation: {
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
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ startTime: -1 });

// ---------------------------------------------------------------------------
// toJSON transform
// ---------------------------------------------------------------------------
tripSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Trip', tripSchema);
