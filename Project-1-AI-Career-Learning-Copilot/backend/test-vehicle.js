/**
 * Phase 5 — Vehicle CRUD Integration Tests
 *
 * Run: node test-vehicle.js
 * Requires the server to be running on PORT 5050.
 */

const BASE = 'http://localhost:5050/api';

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
  const testEmail = `vehicletest_${Date.now()}@fleetdash.io`;
  const vehicleIdStr = `FD-TEST-${Date.now().toString().slice(-4)}`;

  console.log(`Starting Phase 5 Vehicle API tests...\n`);

  // ========================================================================
  console.log('1. GET /api/health');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/health');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
  }

  // ========================================================================
  console.log('\n2. GET /api/vehicles (Initial List - Public)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/vehicles');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('data is array', Array.isArray(data.data));
  }

  // ========================================================================
  console.log('\n3. POST /api/vehicles without Auth Token -> 401');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/vehicles', {
      vehicleNumber: 'UNAUTH-01',
      model: 'Volvo FH',
    });
    assert('status 401', status === 401);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n4. Auth setup: Register & Obtain JWT');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Vehicle Tester',
      email: testEmail,
      password: 'TestPassword123',
      role: 'fleet_dispatcher',
    });
    assert('register status 201', status === 201);
    assert('token present', typeof data.token === 'string');
    token = data.token;
  }

  // ========================================================================
  console.log('\n5. POST /api/vehicles (Create Vehicle with JWT)');
  // ========================================================================
  {
    const { status, data } = await request(
      'POST',
      '/vehicles',
      {
        vehicleNumber: vehicleIdStr,
        model: 'Volvo FH',
        type: 'Truck',
        status: 'online',
        driverName: 'Arun Kumar',
        driverPhone: '9876543210',
        fuelLevel: 78,
        mileage: 12450,
      },
      token
    );

    assert('status 201', status === 201);
    assert('success true', data.success === true);
    assert('data contains _id', !!data.data?._id);
    assert('vehicleId matches', data.data?.vehicleId === vehicleIdStr);
    assert('status is lowercase online', data.data?.status === 'online');
    assert('driverName matches', data.data?.driverName === 'Arun Kumar');

    createdVehicleId = data.data?._id;
  }

  // ========================================================================
  console.log('\n6. POST /api/vehicles (Duplicate vehicleId -> 409)');
  // ========================================================================
  {
    const { status, data } = await request(
      'POST',
      '/vehicles',
      {
        vehicleNumber: vehicleIdStr,
        model: 'Duplicate FH',
      },
      token
    );
    assert('status 409', status === 409);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n7. GET /api/vehicles (Verify Created Vehicle in List)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/vehicles');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    const found = data.data.some((v) => v._id === createdVehicleId);
    assert('created vehicle found in list', found);
  }

  // ========================================================================
  console.log('\n8. GET /api/vehicles/:id (Get by valid ObjectId)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/vehicles/${createdVehicleId}`);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('vehicleId matches', data.data?.vehicleId === vehicleIdStr);
  }

  // ========================================================================
  console.log('\n9. GET /api/vehicles/:id (Invalid ObjectId -> 400)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/vehicles/invalid-id-format');
    assert('status 400', status === 400);
    assert('success false', data.success === false);
    assert('message contains invalid', data.message.toLowerCase().includes('invalid'));
  }

  // ========================================================================
  console.log('\n10. GET /api/vehicles/:id (Nonexistent ObjectId -> 404)');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/vehicles/60f1b2c3d4e5f67890123456');
    assert('status 404', status === 404);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n11. PUT /api/vehicles/:id (Update Vehicle)');
  // ========================================================================
  {
    const { status, data } = await request(
      'PUT',
      `/vehicles/${createdVehicleId}`,
      {
        fuelLevel: 95,
        driverName: 'Arun Kumar Updated',
        status: 'maintenance',
      },
      token
    );
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('fuelLevel updated to 95', data.data?.fuelLevel === 95);
    assert('driverName updated', data.data?.driverName === 'Arun Kumar Updated');
    assert('status updated to maintenance', data.data?.status === 'maintenance');
  }

  // ========================================================================
  console.log('\n12. DELETE /api/vehicles/:id (Delete Vehicle)');
  // ========================================================================
  {
    const { status, data } = await request('DELETE', `/vehicles/${createdVehicleId}`, null, token);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
  }

  // ========================================================================
  console.log('\n13. GET /api/vehicles/:id (Verify Deletion -> 404)');
  // ========================================================================
  {
    const { status, data } = await request('GET', `/vehicles/${createdVehicleId}`);
    assert('status 404', status === 404);
    assert('success false', data.success === false);
  }

  // ========================================================================
  // Cleanup test user
  // ========================================================================
  try {
    const mongoose = require('mongoose');
    const User = require('./src/models/User');
    require('./src/config');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fleetdash' });
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
    console.log(`\n🧹 Cleaned up test user: ${testEmail}`);
  } catch {}

  // ========================================================================
  // Summary
  // ========================================================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${'='.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
