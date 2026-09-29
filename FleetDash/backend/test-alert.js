/**
 * Phase 7 — Alert API Integration Tests
 *
 * Run: node test-alert.js
 * Requires the server to be running on PORT 5050.
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
  let createdAlertId = null;

  const testEmail = `alerttest_${Date.now()}@fleetdash.io`;
  const vehicleIdStr = `FD-ALT-TEST-${Date.now().toString().slice(-4)}`;

  console.log(`Starting Phase 7 Alert API tests...\n`);

  // ========================================================================
  console.log('1. GET /api/health & Existing Endpoints Check');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/health');
    assert('GET /api/health status 200', status === 200);
    assert('GET /api/health success true', data.success === true);

    const resVeh = await request('GET', '/vehicles');
    assert('GET /api/vehicles status 200', resVeh.status === 200);

    const resTrips = await request('GET', '/trips');
    assert('GET /api/trips status 200', resTrips.status === 200);
  }

  // ========================================================================
  console.log('\n2. GET /api/alerts (Initial List - Public)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/alerts');
    assert('GET /api/alerts status 200', status === 200);
    assert('success true', data.success === true);
    assert('data is array', Array.isArray(data.data));
  }

  // ========================================================================
  console.log('\n3. Security Checks (No Auth Token -> 401)');
  // ========================================================================
  {
    const resPost = await request('POST', '/alerts', {
      type: 'speeding',
      message: 'Vehicle exceeded 100km/h',
    });
    assert('POST /api/alerts status 401', resPost.status === 401);
    assert('POST /api/alerts success false', resPost.data.success === false);

    const resPut = await request('PUT', '/alerts/60f1b2c3d4e5f67890123456', {
      status: 'acknowledged',
    });
    assert('PUT /api/alerts/:id status 401', resPut.status === 401);

    const resDel = await request('DELETE', '/alerts/60f1b2c3d4e5f67890123456');
    assert('DELETE /api/alerts/:id status 401', resDel.status === 401);
  }

  // ========================================================================
  console.log('\n4. Auth Setup: Register & Obtain JWT');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Alert Tester',
      email: testEmail,
      password: 'TestPassword123',
      role: 'fleet_dispatcher',
    });
    assert('register status 201', status === 201);
    assert('token present', typeof data.token === 'string');
    token = data.token;
  }

  // ========================================================================
  console.log('\n5. Setup Dependencies: Create Test Vehicle & Trip');
  // ========================================================================
  {
    const resVeh = await request(
      'POST',
      '/vehicles',
      {
        vehicleNumber: vehicleIdStr,
        model: 'Volvo FH16',
        type: 'Truck',
        status: 'online',
        driverName: 'Vikram Singh',
      },
      token
    );
    assert('vehicle create status 201', resVeh.status === 201);
    createdVehicleId = resVeh.data.data?._id;

    const resTrip = await request(
      'POST',
      '/trips',
      {
        vehicle: createdVehicleId,
        driverName: 'Vikram Singh',
        origin: 'Mumbai',
        destination: 'Pune',
        status: 'active',
        startTime: '2026-09-08T08:00:00.000Z',
      },
      token
    );
    assert('trip create status 201', resTrip.status === 201);
    createdTripId = resTrip.data.data?._id;
  }

  // ========================================================================
  console.log('\n6. Validation Tests for POST /api/alerts');
  // ========================================================================
  {
    // Missing vehicle
    const resNoVeh = await request('POST', '/alerts', { type: 'speeding', message: 'Test' }, token);
    assert('Missing vehicle -> 400', resNoVeh.status === 400);

    // Invalid vehicle ID
    const resBadVeh = await request('POST', '/alerts', { vehicle: 'invalid-id', type: 'speeding', message: 'Test' }, token);
    assert('Invalid vehicle ID -> 400', resBadVeh.status === 400);

    // Nonexistent vehicle ID
    const resNonexistVeh = await request('POST', '/alerts', { vehicle: '60f1b2c3d4e5f67890123456', type: 'speeding', message: 'Test' }, token);
    assert('Nonexistent vehicle -> 404', resNonexistVeh.status === 404);

    // Invalid severity
    const resBadSev = await request('POST', '/alerts', { vehicle: createdVehicleId, type: 'speeding', message: 'Test', severity: 'invalid_sev' }, token);
    assert('Invalid severity -> 400', resBadSev.status === 400);

    // Invalid status
    const resBadStat = await request('POST', '/alerts', { vehicle: createdVehicleId, type: 'speeding', message: 'Test', status: 'invalid_stat' }, token);
    assert('Invalid status -> 400', resBadStat.status === 400);
  }

  // ========================================================================
  console.log('\n7. POST /api/alerts (Create Alert with JWT)');
  // ========================================================================
  {
    const alertPayload = {
      vehicle: createdVehicleId,
      trip: createdTripId,
      type: 'speeding',
      severity: 'critical',
      message: 'Vehicle speed exceeded 110 km/h on Expressway',
      status: 'active',
      latitude: 18.5204,
      longitude: 73.8567,
    };

    const { status, data } = await request('POST', '/alerts', alertPayload, token);

    assert('status 201', status === 201);
    assert('success true', data.success === true);
    assert('data contains _id', !!data.data?._id);
    assert('severity is critical', data.data?.severity === 'critical');
    assert('status is active', data.data?.status === 'active');
    assert('type is speeding', data.data?.type === 'speeding');
    assert('vehicle is populated', data.data?.vehicle?.model === 'Volvo FH16');
    assert('trip is populated', data.data?.trip?.origin === 'Mumbai');

    createdAlertId = data.data?._id;
  }

  // ========================================================================
  console.log('\n8. GET /api/alerts (Verify Created Alert & Filtering)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/alerts');
    assert('status 200', status === 200);
    const found = data.data.some((a) => a._id === createdAlertId);
    assert('created alert found in list', found);

    // Filter by severity=critical
    const resSev = await request('GET', '/alerts?severity=critical');
    assert('filter ?severity=critical status 200', resSev.status === 200);
    assert('all returned alerts severity critical', resSev.data.data.every((a) => a.severity === 'critical'));

    // Filter by status=active
    const resStat = await request('GET', '/alerts?status=active');
    assert('filter ?status=active status 200', resStat.status === 200);
    assert('all returned alerts status active', resStat.data.data.every((a) => a.status === 'active'));

    // Combined filter ?severity=critical&status=active
    const resComb = await request('GET', '/alerts?severity=critical&status=active');
    assert('combined filter status 200', resComb.status === 200);
    assert('combined matches', resComb.data.data.every((a) => a.severity === 'critical' && a.status === 'active'));
  }

  // ========================================================================
  console.log('\n9. GET /api/alerts/:id (Get Alert by ID)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/alerts/${createdAlertId}`);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('message matches', data.data?.message?.includes('Expressway'));
    assert('vehicle populated correctly', typeof data.data?.vehicle === 'object');
  }

  // ========================================================================
  console.log('\n10. GET /api/alerts/:id Error Handling');
  // ========================================================================
  {
    const resInvalid = await request('GET', '/alerts/invalid-id-format');
    assert('invalid ObjectId -> 400', resInvalid.status === 400);

    const res404 = await request('GET', '/alerts/60f1b2c3d4e5f67890123456');
    assert('nonexistent ObjectId -> 404', res404.status === 404);
  }

  // ========================================================================
  console.log('\n11. PUT /api/alerts/:id (Update Alert)');
  // ========================================================================
  {
    const { status, data } = await request(
      'PUT',
      `/alerts/${createdAlertId}`,
      {
        status: 'resolved',
        severity: 'warning',
      },
      token
    );
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('status updated to resolved', data.data?.status === 'resolved');
    assert('severity updated to warning', data.data?.severity === 'warning');
    assert('resolvedAt populated automatically', !!data.data?.resolvedAt);
  }

  // ========================================================================
  console.log('\n12. DELETE /api/alerts/:id (Delete Alert)');
  // ========================================================================
  {
    const { status, data } = await request('DELETE', `/alerts/${createdAlertId}`, null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('message contains success', data.message.toLowerCase().includes('success'));
  }

  // ========================================================================
  console.log('\n13. GET /api/alerts/:id (Verify Deletion -> 404)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/alerts/${createdAlertId}`);
    assert('status 404', status === 404);
    assert('success false', data.success === false);
  }

  // ========================================================================
  // Cleanup test vehicle, trip & user
  // ========================================================================
  try {
    const mongoose = require('mongoose');
    const User = require('./src/models/User');
    const Vehicle = require('./src/models/Vehicle');
    const Trip = require('./src/models/Trip');
    const Alert = require('./src/models/Alert');
    require('./src/config');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fleetdash', serverSelectionTimeoutMS: 3000 });
    if (createdAlertId) {
      await Alert.deleteOne({ _id: createdAlertId });
    }
    if (createdTripId) {
      await Trip.deleteOne({ _id: createdTripId });
    }
    if (createdVehicleId) {
      await Vehicle.deleteOne({ _id: createdVehicleId });
    }
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
    console.log(`\n🧹 Cleaned up test data`);
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
