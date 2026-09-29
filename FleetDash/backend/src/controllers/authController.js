/**
 * Auth Controller
 *
 * Handles registration, login, and current-user retrieval.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a signed JWT for the given user ID. */
const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

/** Build a safe user object (no passwordHash, no __v). */
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { name, email, password, role, organization } = req.body || {};

    // --- Validation --------------------------------------------------------
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // --- Check for existing user -------------------------------------------
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // --- Create user (password hashed by pre-save hook) --------------------
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook hashes this
      role: role || 'fleet_dispatcher',
      organization: (organization || '').trim(),
    });

    // --- Generate token & respond ------------------------------------------
    let token;
    try {
      token = signToken(user._id);
    } catch (jwtErr) {
      console.error('[FleetDash] JWT signing failed:', jwtErr.message);
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[FleetDash] Registration error:', err.message);

    // Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors || {})
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: message || 'Validation failed',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // --- Validation --------------------------------------------------------
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // --- Find user (explicitly select passwordHash) ------------------------
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+passwordHash'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // --- Compare password --------------------------------------------------
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // --- Generate token & respond ------------------------------------------
    let token;
    try {
      token = signToken(user._id);
    } catch (jwtErr) {
      console.error('[FleetDash] JWT signing failed:', jwtErr.message);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[FleetDash] Login error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

// ---------------------------------------------------------------------------
// GET /api/auth/me  (requires auth middleware)
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[FleetDash] getMe error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
    });
  }
};

// ---------------------------------------------------------------------------
// POST /api/auth/logout  (stateless — client discards token)
// ---------------------------------------------------------------------------
const logout = (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = { register, login, getMe, logout };
