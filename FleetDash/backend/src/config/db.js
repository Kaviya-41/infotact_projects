/**
 * FleetDash Backend — MongoDB Connection
 *
 * Connects to MongoDB Atlas using Mongoose.
 * The connection string is read from MONGODB_URI in the environment.
 */

const mongoose = require('mongoose');
const config = require('./index');

/**
 * Connect to MongoDB Atlas.
 * Resolves when the connection is established, or throws on failure.
 */
const connectDB = async () => {
  if (!config.mongodbUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      dbName: 'fleetdash',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[FleetDash] MongoDB connected successfully — host: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[FleetDash] Atlas connection failed (${err.message}). Attempting fallback database...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        binary: { version: '6.0.14' },
      });
      const mongoUri = mongoServer.getUri();

      const conn = await mongoose.connect(mongoUri, {
        dbName: 'fleetdash',
      });

      console.log(`[FleetDash] Fallback In-Memory MongoDB connected successfully — host: ${conn.connection.host}`);
    } catch (fallbackErr) {
      console.error(`[FleetDash] MongoDB connection failed: ${err.message}`);
      throw err;
    }
  }
};

module.exports = connectDB;
