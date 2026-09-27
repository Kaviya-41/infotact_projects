/**
 * Trip Routes
 *
 * Base Path: /api/trips
 *
 * GET    /api/trips      — List all trips (Public)
 * GET    /api/trips/:id  — Get trip by ID (Public)
 * POST   /api/trips      — Create new trip (Protected)
 * PUT    /api/trips/:id  — Update trip by ID (Protected)
 * DELETE /api/trips/:id  — Delete trip by ID (Protected)
 */

const { Router } = require('express');
const {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', getTrips);
router.get('/:id', getTripById);
router.post('/', auth, createTrip);
router.put('/:id', auth, updateTrip);
router.delete('/:id', auth, deleteTrip);

module.exports = router;
