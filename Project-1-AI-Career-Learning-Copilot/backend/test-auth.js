/**
 * Phase 4 — Auth Integration Tests
 *
 * Run: node test-auth.js
 * Requires the server to be running on PORT 5055 (or adjust BASE below).
 */

const BASE = 'http://localhost:5055/api';

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
  const testEmail = `test_${Date.now()}@fleetdash.io`;
  let savedToken = null;

  // ========================================================================
  console.log('\n1. GET /api/health');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/health');
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('message correct', data.message === 'FleetDash backend is running');
  }

  // ========================================================================
  console.log('\n2. POST /api/auth/register — success');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: 'TestPass123',
      role: 'dispatcher',
      organization: 'LogiTech Logistics',
    });
    assert('status 201', status === 201);
    assert('success true', data.success === true);
    assert('token returned', typeof data.token === 'string' && data.token.length > 10);
    assert('user.id present', !!data.user?.id);
    assert('user.name correct', data.user?.name === 'Test User');
    assert('user.email correct', data.user?.email === testEmail);
    assert('user.role correct', data.user?.role === 'dispatcher');
    assert('no passwordHash', data.user?.passwordHash === undefined);
    savedToken = data.token;
  }

  // ========================================================================
  console.log('\n3. POST /api/auth/register — duplicate email');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      name: 'Dupe User',
      email: testEmail,
      password: 'AnotherPass1',
    });
    assert('status 409', status === 409);
    assert('success false', data.success === false);
    assert('message mentions duplicate', data.message.toLowerCase().includes('already exists'));
  }

  // ========================================================================
  console.log('\n4. POST /api/auth/register — missing fields');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/register', {
      email: 'nope@test.com',
    });
    assert('status 400', status === 400);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n5. POST /api/auth/login — correct credentials');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'TestPass123',
    });
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('token returned', typeof data.token === 'string' && data.token.length > 10);
    assert('user.email correct', data.user?.email === testEmail);
    assert('no passwordHash', data.user?.passwordHash === undefined);
    savedToken = data.token; // use fresh token
  }

  // ========================================================================
  console.log('\n6. POST /api/auth/login — wrong password');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword999',
    });
    assert('status 401', status === 401);
    assert('success false', data.success === false);
    assert('message invalid credentials', data.message === 'Invalid credentials');
  }

  // ========================================================================
  console.log('\n7. POST /api/auth/login — nonexistent user');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/login', {
      email: 'ghost@nowhere.com',
      password: 'anything',
    });
    assert('status 401', status === 401);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n8. GET /api/auth/me — no token');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/auth/me');
    assert('status 401', status === 401);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n9. GET /api/auth/me — invalid token');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/auth/me', null, 'invalid.token.here');
    assert('status 401', status === 401);
    assert('success false', data.success === false);
  }

  // ========================================================================
  console.log('\n10. GET /api/auth/me — valid token');
  // ========================================================================
  {
    const { status, data } = await request('GET', '/auth/me', null, savedToken);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
    assert('user.email correct', data.user?.email === testEmail);
    assert('user.name correct', data.user?.name === 'Test User');
    assert('no passwordHash', data.user?.passwordHash === undefined);
  }

  // ========================================================================
  console.log('\n11. POST /api/auth/logout — valid token');
  // ========================================================================
  {
    const { status, data } = await request('POST', '/auth/logout', null, savedToken);
    assert('status 200', status === 200);
    assert('success true', data.success === true);
  }

  // ========================================================================
  // Cleanup — delete test user from DB
  // ========================================================================
  try {
    require('./src/config');
    const mongoose = require('mongoose');
    const User = require('./src/models/User');
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'fleetdash' });
    await User.deleteOne({ email: testEmail });
    await mongoose.disconnect();
    console.log(`\n🧹 Cleaned up test user: ${testEmail}`);
  } catch {
    console.log('\n⚠️  Could not clean up test user (not critical)');
  }

  // ========================================================================
  // Summary
  // ========================================================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${'='.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
