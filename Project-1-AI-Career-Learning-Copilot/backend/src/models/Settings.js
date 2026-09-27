/**
 * Settings Model
 *
 * Per-user preferences that back the frontend SettingsPage UI.
 * Each user has at most one Settings document (1-to-1 via user ref).
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ---- Profile (editable in Settings UI) --------------------------------
    fullName: {
      type: String,
      trim: true,
      default: '',
    },

    // ---- Fleet Thresholds --------------------------------------------------
    speedLimitWarning: {
      type: Number, // km/h
      min: 0,
      default: 80,
    },
    idleTimeThreshold: {
      type: Number, // minutes
      min: 0,
      default: 15,
    },
    fuelWarningThreshold: {
      type: Number, // percentage
      min: 0,
      max: 100,
      default: 20,
    },

    // ---- Notification Channels --------------------------------------------
    emailAlertDigest: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },

    // ---- Map & Display ----------------------------------------------------
    defaultMapMode: {
      type: String,
      enum: ['Light', 'Satellite', 'Traffic'],
      default: 'Light',
    },
    canvasFPSRate: {
      type: Number,
      enum: [30, 60],
      default: 60,
    },

    // ---- Appearance -------------------------------------------------------
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark',
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// user index is created automatically by unique: true

// ---------------------------------------------------------------------------
// toJSON transform
// ---------------------------------------------------------------------------
settingsSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Settings', settingsSchema);
