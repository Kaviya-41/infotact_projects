/**
 * telemetrySimulator.js — Real-Time Development Fleet Telemetry Simulator
 *
 * Runs only in development mode (NODE_ENV !== 'production').
 * Periodically updates online vehicles in MongoDB and emits live telemetry
 * through Socket.IO at an interval of 4000ms.
 *
 * Features:
 * - Realistic micro-adjustments to speed (+/- 1-3 km/h)
 * - Continuous, smooth GPS movement along corridor routes
 * - Gradual fuel depletion for active moving vehicles
 * - Incremental mileage updates based on speed and elapsed time
 * - Active trip synchronization (updates Trip.currentLocation)
 * - Intelligent alert generation with cooldown and de-duplication
 * - Emits 'vehicleTelemetry', 'telemetryBatch', 'alertGenerated', 'dashboardUpdate'
 */

const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Alert = require('../models/Alert');

const UPDATE_INTERVAL_MS = 4000;
let simulatorTimer = null;

// Track recent alert creation times to prevent spamming
const alertCooldowns = new Map();
const COOLDOWN_PERIOD_MS = 60000; // 1 minute cooldown per vehicle/type

/**
 * Start the telemetry simulation loop.
 * @param {import('socket.io').Server} io - Active Socket.IO server instance
 */
function startTelemetrySimulator(io) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[TelemetrySimulator] Disabled in production mode.');
    return;
  }

  if (simulatorTimer) {
    clearInterval(simulatorTimer);
  }

  console.log(`[TelemetrySimulator] Starting real-time simulation (interval: ${UPDATE_INTERVAL_MS}ms)...`);

  simulatorTimer = setInterval(async () => {
    try {
      await simulateStep(io);
    } catch (err) {
      console.error('[TelemetrySimulator] Step execution error:', err.message);
    }
  }, UPDATE_INTERVAL_MS);
}

/**
 * Stop the simulator loop.
 */
function stopTelemetrySimulator() {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
    console.log('[TelemetrySimulator] Simulator stopped.');
  }
}

/**
 * Perform a single simulation cycle.
 */
async function simulateStep(io) {
  // Find all online vehicles
  const onlineVehicles = await Vehicle.find({ status: 'online' });
  if (!onlineVehicles || onlineVehicles.length === 0) return;

  const telemetryBatch = [];
  const now = new Date();

  for (const vehicle of onlineVehicles) {
    // 1. Realistic Speed Drift (+/- 2.5 km/h, clamped between 38 and 82 km/h)
    const currentSpeed = vehicle.currentSpeed || 55;
    const speedDelta = (Math.random() - 0.48) * 4; // slight upward/downward drift
    const newSpeed = Math.round(Math.min(82, Math.max(38, currentSpeed + speedDelta)));

    // 2. Realistic GPS Coordinate Movement
    // Small continuous movement: ~0.0003 to 0.0007 degrees (~30-70 meters per tick)
    const currentLat = vehicle.location?.latitude || 12.9250;
    const currentLng = vehicle.location?.longitude || 77.6830;

    // Direct movement generally eastward/northward along Bangalore-Chennai corridor (bearing ~70°)
    const latDelta = (Math.random() * 0.0003 - 0.0001) * (newSpeed / 60);
    const lngDelta = (Math.random() * 0.0005 + 0.0001) * (newSpeed / 60);

    const newLat = parseFloat((currentLat + latDelta).toFixed(6));
    const newLng = parseFloat((currentLng + lngDelta).toFixed(6));

    // 3. Gradual Fuel Depletion (0.01% - 0.03% per cycle while moving)
    const currentFuel = vehicle.fuelLevel !== undefined ? vehicle.fuelLevel : 75;
    const fuelBurn = parseFloat((0.015 + Math.random() * 0.015).toFixed(3));
    const newFuel = Math.max(8, parseFloat((currentFuel - fuelBurn).toFixed(1)));

    // 4. Mileage Increment (distance = speed * time_in_hours)
    const hoursElapsed = UPDATE_INTERVAL_MS / 3600000;
    const distanceAdded = parseFloat((newSpeed * hoursElapsed).toFixed(3));
    const newMileage = parseFloat(((vehicle.mileage || 0) + distanceAdded).toFixed(1));

    // 5. Update Vehicle in MongoDB
    await Vehicle.updateOne(
      { _id: vehicle._id },
      {
        $set: {
          currentSpeed: newSpeed,
          'location.latitude': newLat,
          'location.longitude': newLng,
          fuelLevel: newFuel,
          mileage: newMileage,
          lastUpdated: now,
        },
      }
    );

    // 6. Update any active trip for this vehicle
    await Trip.updateOne(
      { vehicle: vehicle._id, status: 'active' },
      {
        $set: {
          'currentLocation.latitude': newLat,
          'currentLocation.longitude': newLng,
        },
      }
    );

    // 7. Check & generate realistic alerts (with cooldown de-duplication)
    await evaluateAlerts(vehicle, newSpeed, newFuel, newLat, newLng, io);

    // Build standard payload as specified in Section 6
    const payload = {
      vehicleId: vehicle.vehicleId,
      latitude: newLat,
      longitude: newLng,
      speed: newSpeed,
      currentSpeed: newSpeed,
      fuelLevel: newFuel,
      mileage: newMileage,
      status: vehicle.status,
      lastUpdated: now.toISOString(),
    };

    telemetryBatch.push(payload);

    // Emit single vehicle telemetry event
    if (io) {
      io.emit('vehicleTelemetry', payload);
    }
  }

  // Emit batch event for high-throughput clients (e.g. Map / Dashboard)
  if (io && telemetryBatch.length > 0) {
    io.emit('telemetryBatch', telemetryBatch);
    io.emit('dashboardUpdate', { timestamp: now.toISOString(), count: telemetryBatch.length });
  }
}

/**
 * Evaluate alert thresholds with de-duplication logic.
 */
async function evaluateAlerts(vehicle, speed, fuel, lat, lng, io) {
  const vehicleIdStr = vehicle._id.toString();

  // Condition 1: Overspeed Alert (> 78 km/h)
  if (speed > 78) {
    const key = `${vehicleIdStr}_speeding`;
    const lastTriggered = alertCooldowns.get(key) || 0;

    if (Date.now() - lastTriggered > COOLDOWN_PERIOD_MS) {
      // Check if an active speeding alert already exists
      const existing = await Alert.findOne({
        vehicle: vehicle._id,
        type: 'speeding',
        status: 'active',
      });

      if (!existing) {
        alertCooldowns.set(key, Date.now());
        const newAlert = await Alert.create({
          vehicle: vehicle._id,
          type: 'speeding',
          severity: 'critical',
          message: `Vehicle ${vehicle.vehicleId} exceeded maximum corridor speed threshold (${speed} km/h in 60 km/h zone)`,
          status: 'active',
          location: { latitude: lat, longitude: lng },
        });

        const populated = await Alert.findById(newAlert._id).populate('vehicle');
        if (io) {
          io.emit('alertGenerated', populated);
        }
      }
    }
  }

  // Condition 2: Low Fuel Alert (< 20%)
  if (fuel < 20) {
    const key = `${vehicleIdStr}_low_fuel`;
    const lastTriggered = alertCooldowns.get(key) || 0;

    if (Date.now() - lastTriggered > COOLDOWN_PERIOD_MS) {
      const existing = await Alert.findOne({
        vehicle: vehicle._id,
        type: 'low_fuel',
        status: 'active',
      });

      if (!existing) {
        alertCooldowns.set(key, Date.now());
        const newAlert = await Alert.create({
          vehicle: vehicle._id,
          type: 'low_fuel',
          severity: 'warning',
          message: `Vehicle ${vehicle.vehicleId} low fuel alert — level dropped to ${fuel}% (reserve threshold 20%)`,
          status: 'active',
          location: { latitude: lat, longitude: lng },
        });

        const populated = await Alert.findById(newAlert._id).populate('vehicle');
        if (io) {
          io.emit('alertGenerated', populated);
        }
      }
    }
  }
}

module.exports = {
  startTelemetrySimulator,
  stopTelemetrySimulator,
};
