/**
 * seedFleetData.js — Development Fleet Data Seeder
 *
 * Populates MongoDB with realistic development fleet data:
 * - 10 Vehicles (FD-001 through FD-010) with realistic drivers, coordinates, speeds, fuel
 * - 5 Trips (active, completed, planned) linked to vehicles
 * - 6 Alerts (critical, warning, info; active, acknowledged, resolved)
 *
 * Idempotent: Uses upserts and deterministic identifiers so it can be run
 * repeatedly without duplicating records or wiping user accounts.
 *
 * Usage:
 *   node src/scripts/seedFleetData.js
 *   npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Alert = require('../models/Alert');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[Seeder] Error: MONGODB_URI is not defined in environment.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 10 Deterministic Vehicles (Karnataka / Tamil Nadu Highway Corridor)
// ---------------------------------------------------------------------------
const SEED_VEHICLES = [
  {
    vehicleId: 'FD-001',
    registrationNumber: 'KA-01-FD-1001',
    make: 'Volvo',
    model: 'FH16',
    year: 2023,
    type: 'truck',
    driverName: 'Arjun Kumar',
    driverPhone: '+91 98450 12341',
    status: 'online',
    fuelLevel: 76,
    currentSpeed: 68,
    mileage: 24350,
    maintenanceNotes: 'Regular service up to date',
    location: { latitude: 12.9250, longitude: 77.6830 }, // Electronic City, Bangalore
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-002',
    registrationNumber: 'KA-01-FD-1002',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2022,
    type: 'truck',
    driverName: 'Rohan Sharma',
    driverPhone: '+91 98450 12342',
    status: 'online',
    fuelLevel: 62,
    currentSpeed: 54,
    mileage: 38120,
    maintenanceNotes: 'Brake pads inspected last month',
    location: { latitude: 12.7409, longitude: 77.8253 }, // Hosur Border
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-003',
    registrationNumber: 'MH-12-FD-2003',
    make: 'Kenworth',
    model: 'T680',
    year: 2021,
    type: 'truck',
    driverName: 'Rajesh Verma',
    driverPhone: '+91 98450 12343',
    status: 'online',
    fuelLevel: 32,
    currentSpeed: 62,
    mileage: 52940,
    maintenanceNotes: 'Scheduled oil change upcoming',
    location: { latitude: 12.5200, longitude: 78.2100 }, // Krishnagiri
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-004',
    registrationNumber: 'KA-03-FD-1004',
    make: 'Scania',
    model: 'R500',
    year: 2023,
    type: 'truck',
    driverName: 'Karthik S',
    driverPhone: '+91 98450 12344',
    status: 'online',
    fuelLevel: 45,
    currentSpeed: 72,
    mileage: 19800,
    maintenanceNotes: 'Engine diagnostics optimal',
    location: { latitude: 12.9165, longitude: 79.1325 }, // Vellore Bypass
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-005',
    registrationNumber: 'TN-01-FD-3005',
    make: 'Tata',
    model: 'Prima 5530',
    year: 2022,
    type: 'truck',
    driverName: 'Marcus Vance',
    driverPhone: '+91 98450 12345',
    status: 'online',
    fuelLevel: 88,
    currentSpeed: 48,
    mileage: 41250,
    maintenanceNotes: 'Tire rotation completed',
    location: { latitude: 13.0012, longitude: 79.9800 }, // Sriperumbudur
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-006',
    registrationNumber: 'KA-05-FD-1006',
    make: 'Mercedes-Benz',
    model: 'Actros',
    year: 2024,
    type: 'truck',
    driverName: 'Vikram Malhotra',
    driverPhone: '+91 98450 12346',
    status: 'online',
    fuelLevel: 94,
    currentSpeed: 58,
    mileage: 12400,
    maintenanceNotes: 'New vehicle delivery checklist passed',
    location: { latitude: 13.0827, longitude: 80.2707 }, // Chennai Port
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-007',
    registrationNumber: 'DL-01-FD-4007',
    make: 'Ashok Leyland',
    model: 'AVTR 4825',
    year: 2021,
    type: 'truck',
    driverName: 'Suresh Patel',
    driverPhone: '+91 98450 12347',
    status: 'offline',
    fuelLevel: 42,
    currentSpeed: 0,
    mileage: 67300,
    maintenanceNotes: 'Parked at central depot',
    location: { latitude: 12.9800, longitude: 77.5800 }, // Bangalore Depot
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-008',
    registrationNumber: 'KA-04-FD-1008',
    make: 'Tata',
    model: 'Signa 4825',
    year: 2020,
    type: 'truck',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98450 12348',
    status: 'maintenance',
    fuelLevel: 58,
    currentSpeed: 0,
    mileage: 82400,
    maintenanceNotes: 'Transmission fluid flush and brake overhaul in progress',
    location: { latitude: 12.9900, longitude: 77.6600 }, // Whitefield Service Hub
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-009',
    registrationNumber: 'MH-04-FD-2009',
    make: 'Eicher',
    model: 'Pro 6028',
    year: 2023,
    type: 'van',
    driverName: 'Amit Roy',
    driverPhone: '+91 98450 12349',
    status: 'online',
    fuelLevel: 70,
    currentSpeed: 64,
    mileage: 29500,
    maintenanceNotes: 'Express delivery route certified',
    location: { latitude: 12.8399, longitude: 77.6770 }, // Jigani Industrial Area
    lastUpdated: new Date(),
  },
  {
    vehicleId: 'FD-010',
    registrationNumber: 'KA-02-FD-1010',
    make: 'Isuzu',
    model: 'Giga',
    year: 2022,
    type: 'truck',
    driverName: 'Deepak Joshi',
    driverPhone: '+91 98450 12350',
    status: 'offline',
    fuelLevel: 25,
    currentSpeed: 0,
    mileage: 48900,
    maintenanceNotes: 'Awaiting dispatch assignment',
    location: { latitude: 12.9352, longitude: 77.6245 }, // Koramangala Hub
    lastUpdated: new Date(),
  },
];

async function seedData() {
  console.log('[Seeder] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { dbName: 'fleetdash' });
  console.log('[Seeder] Connected successfully.');

  // 1. Seed / Upsert Vehicles
  console.log('[Seeder] Seeding 10 Vehicles...');
  const vehicleMap = {};

  for (const vData of SEED_VEHICLES) {
    const doc = await Vehicle.findOneAndUpdate(
      { vehicleId: vData.vehicleId },
      { $set: vData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    vehicleMap[vData.vehicleId] = doc;
    console.log(`  ✓ Vehicle ${vData.vehicleId} (${vData.make} ${vData.model}) — ${vData.status}`);
  }

  // 2. Seed 5 Realistic Trips
  console.log('\n[Seeder] Seeding 5 Trips...');
  const now = Date.now();

  const SEED_TRIPS = [
    {
      vehicle: vehicleMap['FD-001']._id,
      driverName: 'Arjun Kumar',
      origin: 'Bengaluru Central Depot',
      destination: 'Hosur Industrial Complex',
      status: 'active',
      startTime: new Date(now - 60 * 60000), // 1 hour ago
      estimatedArrival: new Date(now + 45 * 60000), // in 45 mins
      distance: 48,
      currentLocation: { latitude: 12.9250, longitude: 77.6830 },
    },
    {
      vehicle: vehicleMap['FD-004']._id,
      driverName: 'Karthik S',
      origin: 'Bengaluru Depot 4',
      destination: 'Chennai Sriperumbudur Hub',
      status: 'active',
      startTime: new Date(now - 3 * 3600000), // 3 hours ago
      estimatedArrival: new Date(now + 2 * 3600000), // in 2 hours
      distance: 310,
      currentLocation: { latitude: 12.9165, longitude: 79.1325 },
    },
    {
      vehicle: vehicleMap['FD-002']._id,
      driverName: 'Rohan Sharma',
      origin: 'Mysuru Distribution Terminal',
      destination: 'Bengaluru Central Depot',
      status: 'active',
      startTime: new Date(now - 2 * 3600000),
      estimatedArrival: new Date(now + 60 * 60000),
      distance: 145,
      currentLocation: { latitude: 12.7409, longitude: 77.8253 },
    },
    {
      vehicle: vehicleMap['FD-006']._id,
      driverName: 'Vikram Malhotra',
      origin: 'Vellore Terminal',
      destination: 'Chennai Port Container Yard',
      status: 'completed',
      startTime: new Date(now - 5 * 3600000),
      estimatedArrival: new Date(now - 60 * 60000),
      actualArrival: new Date(now - 55 * 60000),
      distance: 138,
      currentLocation: { latitude: 13.0827, longitude: 80.2707 },
    },
    {
      vehicle: vehicleMap['FD-003']._id,
      driverName: 'Rajesh Verma',
      origin: 'Krishnagiri Logistics Center',
      destination: 'Salem Junction Depot',
      status: 'planned',
      startTime: new Date(now + 2 * 3600000),
      estimatedArrival: new Date(now + 5 * 3600000),
      distance: 110,
      currentLocation: { latitude: 12.5200, longitude: 78.2100 },
    },
  ];

  const tripDocs = [];
  for (const tData of SEED_TRIPS) {
    const doc = await Trip.findOneAndUpdate(
      { vehicle: tData.vehicle, origin: tData.origin, destination: tData.destination },
      { $set: tData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    tripDocs.push(doc);
    console.log(`  ✓ Trip: ${tData.origin} → ${tData.destination} (${tData.status})`);
  }

  // 3. Seed 6 Realistic Alerts
  console.log('\n[Seeder] Seeding 6 Alerts...');
  const SEED_ALERTS = [
    {
      vehicle: vehicleMap['FD-004']._id,
      trip: tripDocs[1]._id,
      type: 'speeding',
      severity: 'critical',
      message: 'Vehicle FD-004 exceeded maximum highway speed limit (72 km/h in 60 km/h corridor)',
      status: 'active',
      location: { latitude: 12.9165, longitude: 79.1325 },
    },
    {
      vehicle: vehicleMap['FD-003']._id,
      trip: tripDocs[4]._id,
      type: 'low_fuel',
      severity: 'warning',
      message: 'Vehicle FD-003 fuel level dropped to 32% — below 35% reserve alert threshold',
      status: 'active',
      location: { latitude: 12.5200, longitude: 78.2100 },
    },
    {
      vehicle: vehicleMap['FD-008']._id,
      trip: null,
      type: 'maintenance',
      severity: 'critical',
      message: 'Scheduled 80,000 km transmission & brake overhaul overdue for vehicle FD-008',
      status: 'active',
      location: { latitude: 12.9900, longitude: 77.6600 },
    },
    {
      vehicle: vehicleMap['FD-002']._id,
      trip: tripDocs[2]._id,
      type: 'route_deviation',
      severity: 'warning',
      message: 'Vehicle FD-002 deviated 2.1 km from assigned NH-44 navigation corridor',
      status: 'acknowledged',
      location: { latitude: 12.7409, longitude: 77.8253 },
    },
    {
      vehicle: vehicleMap['FD-010']._id,
      trip: null,
      type: 'gps_issue',
      severity: 'info',
      message: 'Intermittent GPS telemetry signal detected for vehicle FD-010',
      status: 'acknowledged',
      location: { latitude: 12.9352, longitude: 77.6245 },
    },
    {
      vehicle: vehicleMap['FD-001']._id,
      trip: tripDocs[0]._id,
      type: 'speeding',
      severity: 'info',
      message: 'Brief acceleration spike on Electronic City Flyover (resolved automatically)',
      status: 'resolved',
      location: { latitude: 12.9250, longitude: 77.6830 },
      resolvedAt: new Date(now - 30 * 60000),
    },
  ];

  for (const aData of SEED_ALERTS) {
    await Alert.findOneAndUpdate(
      { vehicle: aData.vehicle, type: aData.type, message: aData.message },
      { $set: aData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ Alert: [${aData.severity.toUpperCase()}] ${aData.type} — ${aData.status}`);
  }

  console.log('\n[Seeder] Fleet data seeding complete!');
  console.log('Summary: 10 Vehicles, 5 Trips, 6 Alerts populated in MongoDB.');

  await mongoose.disconnect();
  console.log('[Seeder] Disconnected from MongoDB.');
}

seedData().catch((err) => {
  console.error('[Seeder] Error seeding data:', err);
  process.exit(1);
});
