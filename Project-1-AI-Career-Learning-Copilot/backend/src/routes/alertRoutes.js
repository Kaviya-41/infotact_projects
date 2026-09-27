/**
 * Alert Routes
 *
 * Base Path: /api/alerts
 *
 * GET    /api/alerts      — List all alerts with optional filtering (Public)
 * GET    /api/alerts/:id  — Get single alert by ID (Public)
 * POST   /api/alerts      — Create new alert (Protected)
 * PUT    /api/alerts/:id  — Update alert by ID (Protected)
 * DELETE /api/alerts/:id  — Delete alert by ID (Protected)
 */

const { Router } = require('express');
const {
  getAlerts,
  getAlertById,
  createAlert,
  updateAlert,
  deleteAlert,
} = require('../controllers/alertController');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.post('/', auth, createAlert);
router.put('/:id', auth, updateAlert);
router.delete('/:id', auth, deleteAlert);

module.exports = router;
