/**
 * Profile XSS Security Test
 * 
 * Verifies that the Profile API sanitizes XSS payloads from input fields.
 * 
 * Usage:
 *   node scripts/test-profile-xss.js
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(step, message, status = 'info') {
  const statusColors = {
    info: colors.blue,
    success: colors.green,
    fail: colors.red,
    warn: colors.yellow,
  };
  console.log(`${statusColors[status]}[Step ${step}]${colors.reset} ${message}`);
}

async function createTempUser() {
  const email = `profile-xss-${Date.now()}@gmail.com`;
  const password = `pass-${Date.now()}`;
  
  // Create user directly via Admin API
  const adminResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  
  const adminData = await adminResponse.json();
  if (!adminResponse.ok) throw new Error(adminData.msg || adminData.error_description || 'Failed to create admin user');

  return { email, password, id: adminData.id };
}

async function deleteTempUser(userId) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
}

async function login(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error('Login failed');
  return await response.json();
}

async function updateProfile(token, profileData) {
  const response = await fetch(`${API_BASE_URL}/api/create-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

async function getProfile(token, userId) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data[0];
}

async function runTest() {
  console.log('='.repeat(50));
  console.log('👤 PROFILE XSS SANITIZATION TEST');
  console.log('='.repeat(50));

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let tempUser, token;

  // 1. Create Temp User
  try {
    tempUser = await createTempUser();
    log(1, `Created temp user: ${tempUser.email}`, 'success');
  } catch (e) {
    log(1, `Failed to create temp user: ${e.message}`, 'fail');
    process.exit(1);
  }

  // 2. Login
  try {
    const auth = await login(tempUser.email, tempUser.password);
    token = auth.access_token;
    log(2, 'Logged in successfully', 'success');
  } catch (e) {
    log(2, `Login failed: ${e.message}`, 'fail');
    if (tempUser) await deleteTempUser(tempUser.id);
    process.exit(1);
  }

  // 3. Attempt XSS Injection
  // We use `create-profile` endpoint which handles upsert
  const xssPayload = "<script>alert('XSS')</script>";
  const maliciousData = {
    username: `user_${Date.now()}`,
    name: `Name ${xssPayload}`,
    age: 25,
    gender: 'Other', // Enum check
    college: `College ${xssPayload}`,
    skills: `React, ${xssPayload}, Node`,
    interests: `Hacking ${xssPayload}`,
    // Valid URLs to pass validation
    github_url: 'https://github.com/valid',
    linkedin_url: 'https://linkedin.com/in/valid',
  };
  
  log(3, `Attempting to inject: "${xssPayload}"`, 'info');

  const result = await updateProfile(token, maliciousData);

  if (result.status !== 200) {
    log(3, `Update failed with status ${result.status}`, 'fail');
    console.log(result.data);
    // Cleanup
    await deleteTempUser(tempUser.id);
    process.exit(1);
  }
  
  log(3, 'Profile update request accepted', 'success');

  // 4. Verify Sanitization
  const profile = await getProfile(token, tempUser.id);
  
  if (!profile) {
    log(4, 'Failed to fetch updated profile', 'fail');
    await deleteTempUser(tempUser.id);
    process.exit(1);
  }

  log(4, 'Verifying stored data...', 'info');
  console.log(`   Stored Name:    "${profile.name}"`);
  console.log(`   Stored College: "${profile.college}"`);
  console.log(`   Stored Skills:  "${profile.skills}"`);

  const nameSafe = profile.name === "Name alert('XSS')";
  const collegeSafe = profile.college === "College alert('XSS')";
  const skillsSafe = profile.skills.includes("React, alert('XSS'), Node");

  if (nameSafe && collegeSafe && skillsSafe) {
    log(5, '✅ PASSED: HTML tags were stripped from all fields!', 'success');
  } else {
    log(5, '❌ FAILED: HTML tags were NOT stripped properly.', 'fail');
    if (!nameSafe) console.log(`   Expected Name: "Name alert('XSS')"`);
    if (!collegeSafe) console.log(`   Expected College: "College alert('XSS')"`);
  }

  // Cleanup
  log(6, 'Cleaning up...', 'info');
  await deleteTempUser(tempUser.id);
  log(6, 'Temp user deleted', 'success');
}

runTest();
