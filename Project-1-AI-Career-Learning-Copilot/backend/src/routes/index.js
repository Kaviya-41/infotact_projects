/**
 * Central route index
 *
 * Import and mount all route modules here.
 * Future phases will add vehicle, trip, alert, and dashboard routes.
 */

const { Router } = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const vehicleRoutes = require('./vehicleRoutes');

const tripRoutes = require('./tripRoutes');
const alertRoutes = require('./alertRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = Router();

// --- Health -----------------------------------------------------------------
router.use('/', healthRoutes);

// --- Auth -------------------------------------------------------------------
router.use('/auth', authRoutes);

// --- Vehicles ---------------------------------------------------------------
router.use('/vehicles', vehicleRoutes);

// --- Trips ------------------------------------------------------------------
router.use('/trips', tripRoutes);

// --- Alerts -----------------------------------------------------------------
router.use('/alerts', alertRoutes);

// --- Dashboard --------------------------------------------------------------
router.use('/dashboard', dashboardRoutes);

module.exports = router;

