/**
 * Vehicle Routes
 *
 * Base Path: /api/vehicles
 *
 * GET    /api/vehicles      — List all vehicles (Public)
 * GET    /api/vehicles/:id  — Get vehicle by ID (Public)
 * POST   /api/vehicles      — Create new vehicle (Protected)
 * PUT    /api/vehicles/:id  — Update vehicle by ID (Protected)
 * DELETE /api/vehicles/:id  — Delete vehicle by ID (Protected)
 */

const { Router } = require('express');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', auth, createVehicle);
router.put('/:id', auth, updateVehicle);
router.delete('/:id', auth, deleteVehicle);

module.exports = router;
