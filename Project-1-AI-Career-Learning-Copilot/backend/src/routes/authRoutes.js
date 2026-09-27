/**
 * Auth Routes
 *
 * POST /auth/register  — create a new user account
 * POST /auth/login     — authenticate and receive a JWT
 * GET  /auth/me        — get current authenticated user
 * POST /auth/logout    — client-side logout (stateless)
 */

const { Router } = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

module.exports = router;
