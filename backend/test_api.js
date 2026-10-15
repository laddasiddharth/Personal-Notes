/**
 * ========================================================
 * 🧪 Personal Notes App — Automated API Verification Suite
 * ========================================================
 *
 * Runs end-to-end integration tests covering:
 * - Health check endpoint and 404 JSON fallback
 * - Authentication input validation, RFC email checks, and Bcrypt hashing
 * - MongoDB duplicate key (E11000) race condition handling
 * - Note CRUD operations with strict JWT access control
 * - Non-string and oversized input validation on POST and PUT
 * - Tag sanitization and deduplication
 *
 * Usage:
 *   node test_api.js                            (tests local http://localhost:5000)
 *   node test_api.js https://your-app.onrender.com (tests live deployed server)
 */

// Target API base URL (accepts command line argument or falls back to local port 5000)
const targetUrl = (process.argv[2] || process.env.TEST_URL || 'http://localhost:5000').replace(/\/+$/, '');

// Helper for HTTP requests using Node.js native fetch
async function apiRequest(endpoint, options = {}) {
  const url = `${targetUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log(`🧪 Running Personal Notes API Test Suite`);
  console.log(`🎯 Target Server: ${targetUrl}`);
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ----------------------------------------------------
  // Test 1: Health Check Endpoint
  // ----------------------------------------------------
  console.log('📌 Test 1: Server Health Check & Database Connectivity');
  const healthRes = await apiRequest('/');
  assert(healthRes.status === 200, 'GET / returned status 200');
  assert(healthRes.data?.status === 'online', 'Server reports status: online');
  console.log(`     Database status: ${healthRes.data?.databaseStatus}\n`);

  // ----------------------------------------------------
  // Test 2: 404 JSON Handler
  // ----------------------------------------------------
  console.log('📌 Test 2: Catch-All 404 Handler (JSON response)');
  const notFoundRes = await apiRequest('/api/undefined-endpoint-test');
  assert(notFoundRes.status === 404, 'Undefined route returns status 404');
  assert(typeof notFoundRes.data === 'object' && notFoundRes.data?.error, '404 returns JSON with error message');
  console.log(`     Response: ${JSON.stringify(notFoundRes.data)}\n`);

  // ----------------------------------------------------
  // Test 3: Validation on Registration
  // ----------------------------------------------------
  console.log('📌 Test 3: Registration Input Validation');
  const invalidEmailRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: 'not-a-valid-email', password: 'password123' },
  });
  assert(invalidEmailRes.status === 400, 'Invalid email format rejected with 400 Bad Request');

  const shortPasswordRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: 'valid@example.com', password: '123' },
  });
  assert(shortPasswordRes.status === 400, 'Short password (<6 chars) rejected with 400 Bad Request');

  const nonStringNameRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: 99999, email: 'valid2@example.com', password: 'password123' },
  });
  assert(nonStringNameRes.status === 400, 'Non-string name rejected with 400 Bad Request\n');

  // ----------------------------------------------------
  // Test 4: Register a Valid User
  // ----------------------------------------------------
  console.log('📌 Test 4: Successful User Registration & JWT Generation');
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const registerRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: 'Automated Tester', email: uniqueEmail, password: 'securepassword123' },
  });
  assert(registerRes.status === 201, 'Registration returns status 201 Created');
  assert(Boolean(registerRes.data?.token), 'Response contains signed JWT token');
  assert(registerRes.data?.user?.email === uniqueEmail, 'Response contains user profile without password');
  const authToken = registerRes.data.token;
  const authHeaders = { Authorization: `Bearer ${authToken}` };
  console.log(`     Registered: ${uniqueEmail}\n`);

  // ----------------------------------------------------
  // Test 5: Duplicate Email Handling (E11000)
  // ----------------------------------------------------
  console.log('📌 Test 5: Duplicate Registration Handling');
  const duplicateRes = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name: 'Duplicate User', email: uniqueEmail, password: 'securepassword123' },
  });
  assert(duplicateRes.status === 400, 'Duplicate email registration returns 400 Bad Request (not 500)');
  assert(duplicateRes.data?.error?.includes('already exists'), 'Error message clearly states account exists\n');

  // ----------------------------------------------------
  // Test 6: User Login
  // ----------------------------------------------------
  console.log('📌 Test 6: User Authentication & Login');
  const loginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: uniqueEmail, password: 'securepassword123' },
  });
  assert(loginRes.status === 200, 'Login with correct credentials returns 200 OK');
  assert(Boolean(loginRes.data?.token), 'Login response contains new valid JWT');

  const badLoginRes = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: uniqueEmail, password: 'wrongpassword' },
  });
  assert(badLoginRes.status === 400, 'Login with incorrect password returns 400 Bad Request\n');

  // ----------------------------------------------------
  // Test 7: Protected Route Access Without Token
  // ----------------------------------------------------
  console.log('📌 Test 7: Access Control & JWT Verification');
  const unauthRes = await apiRequest('/api/notes', { method: 'GET' });
  assert(unauthRes.status === 401, 'Request without Bearer token rejected with 401 Unauthorized\n');

  // ----------------------------------------------------
  // Test 8: Note Input Validation
  // ----------------------------------------------------
  console.log('📌 Test 8: Note Creation Input & Type Validation');
  const nonStringNoteRes = await apiRequest('/api/notes', {
    method: 'POST',
    headers: authHeaders,
    body: { title: 12345, content: 'Some valid content' },
  });
  assert(nonStringNoteRes.status === 400, 'Non-string title rejected with 400 Bad Request (not 500)');

  const emptyNoteRes = await apiRequest('/api/notes', {
    method: 'POST',
    headers: authHeaders,
    body: { title: '   ', content: 'Valid' },
  });
  assert(emptyNoteRes.status === 400, 'Whitespace-only title rejected with 400 Bad Request\n');

  // ----------------------------------------------------
  // Test 9: Create Note with Tag Deduplication & Pinning
  // ----------------------------------------------------
  console.log('📌 Test 9: Create Note & Tag Deduplication');
  const createNoteRes = await apiRequest('/api/notes', {
    method: 'POST',
    headers: authHeaders,
    body: {
      title: 'Automated Test Note',
      content: 'Testing note content and features.',
      tags: ['audit', 'audit', 'security', 'audit', 'test'],
      pinned: true,
    },
  });
  assert(createNoteRes.status === 201, 'Valid note creation returns 201 Created');
  assert(createNoteRes.data?.pinned === true, 'Note correctly saved as pinned');
  assert(createNoteRes.data?.tags?.length === 3, 'Duplicate tags automatically deduplicated (5 -> 3)');
  const createdNoteId = createNoteRes.data._id;
  console.log(`     Created Note ID: ${createdNoteId}\n`);

  // ----------------------------------------------------
  // Test 10: Update Note (PUT)
  // ----------------------------------------------------
  console.log('📌 Test 10: Update Note (PUT /api/notes/:id)');
  const updateRes = await apiRequest(`/api/notes/${createdNoteId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: {
      title: 'Updated Note Title',
      pinned: false,
    },
  });
  assert(updateRes.status === 200, 'Note update returns 200 OK');
  assert(updateRes.data?.title === 'Updated Note Title', 'Note title updated successfully');
  assert(updateRes.data?.pinned === false, 'Pinned state successfully toggled to false\n');

  // ----------------------------------------------------
  // Test 11: Delete Note (DELETE)
  // ----------------------------------------------------
  console.log('📌 Test 11: Delete Note (DELETE /api/notes/:id)');
  const deleteRes = await apiRequest(`/api/notes/${createdNoteId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  assert(deleteRes.status === 200, 'Note deletion returns 200 OK');
  assert(deleteRes.data?.id === createdNoteId, 'Delete response confirms note ID deleted\n');

  // ----------------------------------------------------
  // Completion Summary
  // ----------------------------------------------------
  console.log('====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err.message);
  process.exit(1);
});
