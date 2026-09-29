/**
 * Phase 8 — Dashboard API Integration Tests
 *
 * Run: node test-dashboard.js
 * Requires the server to be running on PORT 5050.
 *
 * Creates temporary test data (vehicle, trip, alerts), verifies every dashboard
 * endpoint returns live numbers, then cleans up.
 */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:5050/api';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

(async () => {
  let token = null;
  let createdVehicleId = null;
  let createdTripId = null;
  const createdAlertIds = [];

  const testEmail = `dashtest_${Date.now()}@fleetdash.io`;
  const vehicleIdStr = `FD-DASH-${Date.now().toString().slice(-4)}`;

  console.log('Starting Phase 8 Dashboard API tests...\n');

  // ========================================================================
  console.log('1. Prerequisite Checks');
  // ========================================================================
  {
    const resHealth = await request('GET', '/health');
    assert('GET /api/health status 200', resHealth.status === 200);

    const resVeh = await request('GET', '/vehicles');
    assert('GET /api/vehicles status 200', resVeh.status === 200);

    const resTrips = await request('GET', '/trips');
    assert('GET /api/trips status 200', resTrips.status === 200);

    const resAlerts = await request('GET', '/alerts');
    assert('GET /api/alerts status 200', resAlerts.status === 200);
  }

  // ========================================================================
  console.log('\n2. Auth Setup: Register & Obtain JWT');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Dashboard Tester',
      email: testEmail,
      password: 'TestPassword123',
      role: 'fleet_dispatcher',
    });
    assert('register status 201', status === 201);
    assert('token present', typeof data.token === 'string');
    token = data.token;
  }

  // ========================================================================
  console.log('\n3. Security: Dashboard endpoints require JWT (401)');
  // ========================================================================
  {
    const endpoints = [
      '/dashboard/summary',
      '/dashboard/vehicle-status',
      '/dashboard/trip-status',
      '/dashboard/alert-summary',
      '/dashboard/recent-alerts',
      '/dashboard/recent-trips',
      '/dashboard/overview',
    ];

    for (const ep of endpoints) {
      const { status } = await request('GET', ep);
      assert(`GET ${ep} without JWT -> 401`, status === 401);
    }
  }

  // ========================================================================
  console.log('\n4. Baseline: Capture initial dashboard counts');
  // ========================================================================
  let baselineSummary;
  {
    const { status, data } = await request('GET', '/dashboard/summary', null, token);
    assert('GET /api/dashboard/summary status 200', status === 200);
    assert('summary success true', data.success === true);
    assert('summary has data object', typeof data.data === 'object');
    assert('totalVehicles is number', typeof data.data.totalVehicles === 'number');
    assert('totalTrips is number', typeof data.data.totalTrips === 'number');
    assert('totalAlerts is number', typeof data.data.totalAlerts === 'number');
    assert('activeVehicles is number', typeof data.data.activeVehicles === 'number');
    assert('inactiveVehicles is number', typeof data.data.inactiveVehicles === 'number');
    assert('activeTrips is number', typeof data.data.activeTrips === 'number');
    assert('completedTrips is number', typeof data.data.completedTrips === 'number');
    assert('plannedTrips is number', typeof data.data.plannedTrips === 'number');
    assert('cancelledTrips is number', typeof data.data.cancelledTrips === 'number');
    assert('activeAlerts is number', typeof data.data.activeAlerts === 'number');
    assert('criticalAlerts is number', typeof data.data.criticalAlerts === 'number');
    assert('warningAlerts is number', typeof data.data.warningAlerts === 'number');
    assert('infoAlerts is number', typeof data.data.infoAlerts === 'number');
    baselineSummary = data.data;
  }

  // ========================================================================
  console.log('\n5. Create Test Data: Vehicle, Trip, Alerts');
  // ========================================================================
  {
    // Vehicle
    const resVeh = await request(
      'POST',
      '/vehicles',
      {
        vehicleNumber: vehicleIdStr,
        model: 'Test Dashboard Truck',
        type: 'Truck',
        status: 'online',
        driverName: 'Dashboard Driver',
      },
      token
    );
    assert('vehicle create status 201', resVeh.status === 201);
    createdVehicleId = resVeh.data.data?._id;

    // Trip
    const resTrip = await request(
      'POST',
      '/trips',
      {
        vehicle: createdVehicleId,
        driverName: 'Dashboard Driver',
        origin: 'Delhi',
        destination: 'Jaipur',
        status: 'active',
        startTime: '2026-09-08T06:00:00.000Z',
        distance: 280,
      },
      token
    );
    assert('trip create status 201', resTrip.status === 201);
    createdTripId = resTrip.data.data?._id;

    // Alerts: 1 critical active, 1 warning active, 1 info resolved
    const alertPayloads = [
      { vehicle: createdVehicleId, trip: createdTripId, type: 'speeding', severity: 'critical', message: 'Dash test critical alert', status: 'active' },
      { vehicle: createdVehicleId, type: 'low_fuel', severity: 'warning', message: 'Dash test warning alert', status: 'active' },
      { vehicle: createdVehicleId, type: 'idle', severity: 'info', message: 'Dash test info alert', status: 'resolved' },
    ];

    for (const payload of alertPayloads) {
      const resA = await request('POST', '/alerts', payload, token);
      assert(`alert create (${payload.severity}) status 201`, resA.status === 201);
      createdAlertIds.push(resA.data.data?._id);
    }
  }

  // ========================================================================
  console.log('\n6. GET /api/dashboard/summary (After data creation)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/summary', null, token);
    assert('status 200', status === 200);
    assert('totalVehicles increased by 1', data.data.totalVehicles === baselineSummary.totalVehicles + 1);
    assert('activeVehicles increased by 1', data.data.activeVehicles === baselineSummary.activeVehicles + 1);
    assert('totalTrips increased by 1', data.data.totalTrips === baselineSummary.totalTrips + 1);
    assert('activeTrips increased by 1', data.data.activeTrips === baselineSummary.activeTrips + 1);
    assert('totalAlerts increased by 3', data.data.totalAlerts === baselineSummary.totalAlerts + 3);
    assert('activeAlerts increased by 2', data.data.activeAlerts === baselineSummary.activeAlerts + 2);
    assert('criticalAlerts increased by 1', data.data.criticalAlerts === baselineSummary.criticalAlerts + 1);
    assert('warningAlerts increased by 1', data.data.warningAlerts === baselineSummary.warningAlerts + 1);
    assert('infoAlerts increased by 1', data.data.infoAlerts === baselineSummary.infoAlerts + 1);
  }

  // ========================================================================
  console.log('\n7. GET /api/dashboard/vehicle-status');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/vehicle-status', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('data is array', Array.isArray(data.data));
    assert('each entry has status and count', data.data.every((d) => typeof d.status === 'string' && typeof d.count === 'number'));

    // Verify online count includes our new vehicle
    const onlineEntry = data.data.find((d) => d.status === 'online');
    assert('online entry exists', !!onlineEntry);
    assert('online count >= 1', onlineEntry.count >= 1);
  }

  // ========================================================================
  console.log('\n8. GET /api/dashboard/trip-status');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/trip-status', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('data is array', Array.isArray(data.data));
    assert('each entry has status and count', data.data.every((d) => typeof d.status === 'string' && typeof d.count === 'number'));

    const activeEntry = data.data.find((d) => d.status === 'active');
    assert('active entry exists', !!activeEntry);
    assert('active count >= 1', activeEntry.count >= 1);
  }

  // ========================================================================
  console.log('\n9. GET /api/dashboard/alert-summary');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/alert-summary', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('bySeverity is array', Array.isArray(data.data.bySeverity));
    assert('byStatus is array', Array.isArray(data.data.byStatus));
    assert('bySeverity entries have severity+count', data.data.bySeverity.every((d) => typeof d.severity === 'string' && typeof d.count === 'number'));
    assert('byStatus entries have status+count', data.data.byStatus.every((d) => typeof d.status === 'string' && typeof d.count === 'number'));

    const critEntry = data.data.bySeverity.find((d) => d.severity === 'critical');
    assert('critical severity entry exists', !!critEntry);
    assert('critical count >= 1', critEntry.count >= 1);
  }

  // ========================================================================
  console.log('\n10. GET /api/dashboard/recent-alerts');
  // ========================================================================
  {
    // Default (5)
    const { status, data } = await request('GET', '/dashboard/recent-alerts', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('count is number', typeof data.count === 'number');
    assert('data is array', Array.isArray(data.data));
    assert('count <= 5 (default)', data.count <= 5);

    // Sorted newest first
    if (data.data.length >= 2) {
      const d0 = new Date(data.data[0].createdAt).getTime();
      const d1 = new Date(data.data[1].createdAt).getTime();
      assert('sorted newest first', d0 >= d1);
    }

    // With limit=2
    const res2 = await request('GET', '/dashboard/recent-alerts?limit=2', null, token);
    assert('limit=2 status 200', res2.status === 200);
    assert('limit=2 count <= 2', res2.data.count <= 2);

    // With limit=10
    const res10 = await request('GET', '/dashboard/recent-alerts?limit=10', null, token);
    assert('limit=10 status 200', res10.status === 200);
    assert('limit=10 count <= 10', res10.data.count <= 10);

    // Invalid limit
    const resBad = await request('GET', '/dashboard/recent-alerts?limit=-5', null, token);
    assert('invalid limit -> 400', resBad.status === 400);

    const resBad2 = await request('GET', '/dashboard/recent-alerts?limit=abc', null, token);
    assert('non-numeric limit -> 400', resBad2.status === 400);
  }

  // ========================================================================
  console.log('\n11. GET /api/dashboard/recent-trips');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/recent-trips', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('count is number', typeof data.count === 'number');
    assert('data is array', Array.isArray(data.data));
    assert('count <= 5 (default)', data.count <= 5);

    // With limit=10
    const res10 = await request('GET', '/dashboard/recent-trips?limit=10', null, token);
    assert('limit=10 status 200', res10.status === 200);
    assert('limit=10 count <= 10', res10.data.count <= 10);

    // Invalid limit
    const resBad = await request('GET', '/dashboard/recent-trips?limit=0', null, token);
    assert('invalid limit=0 -> 400', resBad.status === 400);
  }

  // ========================================================================
  console.log('\n12. GET /api/dashboard/overview');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/dashboard/overview', null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('data.summary exists', typeof data.data.summary === 'object');
    assert('data.vehicleStatus is array', Array.isArray(data.data.vehicleStatus));
    assert('data.tripStatus is array', Array.isArray(data.data.tripStatus));
    assert('data.alertSummary exists', typeof data.data.alertSummary === 'object');
    assert('data.alertSummary.bySeverity is array', Array.isArray(data.data.alertSummary.bySeverity));
    assert('data.alertSummary.byStatus is array', Array.isArray(data.data.alertSummary.byStatus));
    assert('data.recentAlerts is array', Array.isArray(data.data.recentAlerts));
    assert('data.recentTrips is array', Array.isArray(data.data.recentTrips));

    // Overview summary should match standalone summary
    assert('overview totalVehicles matches', data.data.summary.totalVehicles === baselineSummary.totalVehicles + 1);
    assert('overview totalTrips matches', data.data.summary.totalTrips === baselineSummary.totalTrips + 1);
    assert('overview totalAlerts matches', data.data.summary.totalAlerts === baselineSummary.totalAlerts + 3);
  }

  // ========================================================================
  console.log('\n13. Verify existing APIs still work after dashboard addition');
  // ========================================================================
  {
    const resH = await request('GET', '/health');
    assert('GET /api/health still 200', resH.status === 200);

    const resV = await request('GET', '/vehicles');
    assert('GET /api/vehicles still 200', resV.status === 200);

    const resT = await request('GET', '/trips');
    assert('GET /api/trips still 200', resT.status === 200);

    const resA = await request('GET', '/alerts');
    assert('GET /api/alerts still 200', resA.status === 200);

    const resMe = await request('GET', '/auth/me', null, token);
    assert('GET /api/auth/me still 200', resMe.status === 200);
  }

  // ========================================================================
  // Cleanup
  // ========================================================================
  try {
    const mongoose = require('mongoose');
    const User = require('./src/models/User');
    const Vehicle = require('./src/models/Vehicle');
    const Trip = require('./src/models/Trip');
    const Alert = require('./src/models/Alert');
    require('./src/config');
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'fleetdash',
      serverSelectionTimeoutMS: 3000,
    });

    for (const aid of createdAlertIds) {
      if (aid) await Alert.deleteOne({ _id: aid });
    }
    if (createdTripId) await Trip.deleteOne({ _id: createdTripId });
    if (createdVehicleId) await Vehicle.deleteOne({ _id: createdVehicleId });
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
    console.log('\n🧹 Cleaned up test data');
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }

  // ========================================================================
  // Summary
  // ========================================================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${'='.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
