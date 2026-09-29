/**
 * Model Index — re-exports all Mongoose models for convenient imports.
 *
 * Usage:
 *   const { User, Vehicle, Trip, Alert, Settings } = require('../models');
 */

const User = require('./User');
const Vehicle = require('./Vehicle');
const Trip = require('./Trip');
const Alert = require('./Alert');
const Settings = require('./Settings');

module.exports = { User, Vehicle, Trip, Alert, Settings };
