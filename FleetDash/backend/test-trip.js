/**
 * Phase 6 — Trip API Integration Tests
 *
 * Run: node test-trip.js
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
  let createdVehicleMongoId = null;
  let createdTripId = null;
  const testEmail = `triptest_${Date.now()}@fleetdash.io`;
  const vehicleIdStr = `FD-TRIP-TEST-${Date.now().toString().slice(-4)}`;

  console.log(`Starting Phase 6 Trip API tests...\n`);

  // ========================================================================
  console.log('1. GET /api/health');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/health');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
  }

  // ========================================================================
  console.log('\n2. GET /api/trips (Initial List - Public)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/trips');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('data is array', Array.isArray(data.data));
  }

  // ========================================================================
  console.log('\n3. Security Checks (No Auth Token -> 401)');
  // ========================================================================
  {
    const resPost = await request('POST', '/trips', {
      origin: 'Bangalore',
      destination: 'Chennai',
    });
    assert('POST /api/trips status 401', resPost.status === 401);
    assert('POST /api/trips success false', resPost.data.success === false);

    const resPut = await request('PUT', '/trips/60f1b2c3d4e5f67890123456', {
      status: 'completed',
    });
    assert('PUT /api/trips/:id status 401', resPut.status === 401);

    const resDel = await request('DELETE', '/trips/60f1b2c3d4e5f67890123456');
    assert('DELETE /api/trips/:id status 401', resDel.status === 401);
  }

  // ========================================================================
  console.log('\n4. Auth setup: Register & Obtain JWT');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Trip Tester',
      email: testEmail,
      password: 'TestPassword123',
      role: 'fleet_dispatcher',
    });
    assert('register status 201', status === 201);
    assert('token present', typeof data.token === 'string');
    token = data.token;
  }

  // ========================================================================
  console.log('\n5. Vehicle Setup: Create test vehicle');
  // ========================================================================
  {
    const { status, data } = await request(
      'POST',
      '/vehicles',
      {
        vehicleNumber: vehicleIdStr,
        model: 'Tata Prima',
        type: 'Truck',
        status: 'online',
        driverName: 'Arun Kumar',
      },
      token
    );
    assert('vehicle create status 201', status === 201);
    assert('vehicle data has _id', !!data.data?._id);
    createdVehicleMongoId = data.data?._id;
  }

  // ========================================================================
  console.log('\n6. Validation Tests for POST /api/trips');
  // ========================================================================
  {
    // Invalid Vehicle ID format
    const resInvalidVehicle = await request(
      'POST',
      '/trips',
      {
        vehicle: 'invalid-id-format',
        origin: 'Bangalore',
        destination: 'Chennai',
      },
      token
    );
    assert('Invalid vehicle ID -> 400', resInvalidVehicle.status === 400);

    // Nonexistent Vehicle ID
    const resNonexistentVehicle = await request(
      'POST',
      '/trips',
      {
        vehicle: '60f1b2c3d4e5f67890123456',
        origin: 'Bangalore',
        destination: 'Chennai',
      },
      token
    );
    assert('Nonexistent vehicle -> 404', resNonexistentVehicle.status === 404);

    // Invalid Status
    const resInvalidStatus = await request(
      'POST',
      '/trips',
      {
        vehicle: createdVehicleMongoId,
        origin: 'Bangalore',
        destination: 'Chennai',
        status: 'invalid_status_value',
      },
      token
    );
    assert('Invalid status -> 400', resInvalidStatus.status === 400);

    // Invalid Date
    const resInvalidDate = await request(
      'POST',
      '/trips',
      {
        vehicle: createdVehicleMongoId,
        origin: 'Bangalore',
        destination: 'Chennai',
        startTime: 'not-a-valid-date',
      },
      token
    );
    assert('Invalid date format -> 400', resInvalidDate.status === 400);
  }

  // ========================================================================
  console.log('\n7. POST /api/trips (Create Trip with JWT)');
  // ========================================================================
  {
    const tripPayload = {
      vehicle: createdVehicleMongoId,
      driverName: 'Arun Kumar',
      origin: 'Bangalore',
      destination: 'Chennai',
      status: 'planned',
      startTime: '2026-09-05T10:00:00.000Z',
      estimatedArrival: '2026-09-05T18:00:00.000Z',
      distance: 350,
    };

    const { status, data } = await request('POST', '/trips', tripPayload, token);

    assert('status 201', status === 201);
    assert('success true', data.success === true);
    assert('data contains _id', !!data.data?._id);
    assert('origin matches', data.data?.origin === 'Bangalore');
    assert('destination matches', data.data?.destination === 'Chennai');
    assert('status is planned', data.data?.status === 'planned');
    assert('distance is 350', data.data?.distance === 350);
    assert('vehicle is populated', data.data?.vehicle?.model === 'Tata Prima');

    createdTripId = data.data?._id;
  }

  // ========================================================================
  console.log('\n8. GET /api/trips (Verify Created Trip in List)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/trips');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    const found = data.data.some((t) => t._id === createdTripId);
    assert('created trip found in list', found);
  }

  // ========================================================================
  console.log('\n9. GET /api/trips/:id (Get Trip by ID)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/trips/${createdTripId}`);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('origin matches Bangalore', data.data?.origin === 'Bangalore');
    assert('vehicle populated correctly', typeof data.data?.vehicle === 'object');
  }

  // ========================================================================
  console.log('\n10. GET /api/trips/:id Error Handling');
  // ========================================================================
  {
    const resInvalid = await request('GET', '/trips/invalid-id-format');
    assert('invalid ObjectId -> 400', resInvalid.status === 400);

    const res404 = await request('GET', '/trips/60f1b2c3d4e5f67890123456');
    assert('nonexistent ObjectId -> 404', res404.status === 404);
  }

  // ========================================================================
  console.log('\n11. PUT /api/trips/:id (Update Trip)');
  // ========================================================================
  {
    const { status, data } = await request(
      'PUT',
      `/trips/${createdTripId}`,
      {
        status: 'active',
        distance: 360,
        driverName: 'Arun Kumar Updated',
      },
      token
    );
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('status updated to active', data.data?.status === 'active');
    assert('distance updated to 360', data.data?.distance === 360);
    assert('driverName updated', data.data?.driverName === 'Arun Kumar Updated');
  }

  // ========================================================================
  console.log('\n12. DELETE /api/trips/:id (Delete Trip)');
  // ========================================================================
  {
    const { status, data } = await request('DELETE', `/trips/${createdTripId}`, null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('message contains success', data.message.toLowerCase().includes('success'));
  }

  // ========================================================================
  console.log('\n13. GET /api/trips/:id (Verify Deletion -> 404)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/trips/${createdTripId}`);
    assert('status 404', status === 404);
    assert('success false', data.success === false);
  }

  // ========================================================================
  // Cleanup test vehicle & user
  // ========================================================================
  try {
    const mongoose = require('mongoose');
    const User = require('./src/models/User');
    const Vehicle = require('./src/models/Vehicle');
    require('./src/config');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fleetdash', serverSelectionTimeoutMS: 3000 });
    if (createdVehicleMongoId) {
      await Vehicle.deleteOne({ _id: createdVehicleMongoId });
    }
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
    console.log(`\n🧹 Cleaned up test vehicle and user`);
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
