/**
 * XSS Security Test
 * 
 * Verifies that the Team API sanitizes XSS payloads from input fields.
 * 
 * Usage:
 *   node scripts/test-xss.js
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Use Service Role Key to create temp user
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const email = `xss-test-${Date.now()}@gmail.com`;
  const password = `pass-${Date.now()}`;
  
  // Create user directly via Admin API (auto-confirms email)
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

  // Manually create profile to satisfy foreign key/application logic
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id: adminData.id,
      username: `user_${Date.now()}`,
      name: 'XSS Test User',
      age: 25,
      gender: 'Other'
      // bio, location, skills etc. likely don't exist as columns or aren't needed for minimal check
    })
  });

  if (!profileResponse.ok) {
     const pErr = await profileResponse.text();
     console.error('Profile creation failed:', pErr);
     throw new Error('Profile creation failed: ' + pErr);
  }

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

async function createTeam(token) {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: `XSS-Test-${Date.now()}`,
      description: 'Safe description',
    }),
  });
  return await response.json();
}

async function patchTeam(token, teamId, updates) {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  return { status: response.status, data: await response.json() };
}

async function runTest() {
  console.log('='.repeat(50));
  console.log('🛡️  XSS SANITIZATION TEST');
  console.log('='.repeat(50));

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  let tempUser, token, teamId;

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
    // Cleanup
    if (tempUser) await deleteTempUser(tempUser.id);
    process.exit(1);
  }

  // 3. Create Team
  try {
    const teamData = await createTeam(token);
    teamId = teamData.team?.id || teamData.id || teamData.team_id;
    if (!teamId) throw new Error('No team ID returned: ' + JSON.stringify(teamData));
    log(3, `Created test team: ${teamId}`, 'success');
  } catch (e) {
    log(3, `Create team failed: ${e.message}`, 'fail');
    if (tempUser) await deleteTempUser(tempUser.id);
    process.exit(1);
  }

  // 4. Attempt XSS Injection
  const payload = "<script>alert('XSS')</script>";
  const maliciousInput = `Team ${payload}`;
  
  log(4, `Attempting to inject: "${maliciousInput}"`, 'info');

  const result = await patchTeam(token, teamId, {
    name: maliciousInput,
    description: `Description with <b>bold</b> and ${payload}`,
  });

  if (result.status !== 200) {
    log(4, `Update failed with status ${result.status}`, 'fail');
    console.log(result.data);
    // Cleanup
    await deleteTempUser(tempUser.id);
    process.exit(1);
  }

  // 5. Verify Sanitization
  const getResponse = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
     headers: { 'Authorization': `Bearer ${token}` }
  });
  const teamData = (await getResponse.json()).team;

  log(5, 'Verifying stored data...', 'info');
  console.log(`   Stored Name: "${teamData.name}"`);
  console.log(`   Stored Desc: "${teamData.description}"`);

  const nameSafe = teamData.name === "Team alert('XSS')";
  const descSafe = teamData.description === "Description with bold and alert('XSS')";

  if (nameSafe && descSafe) {
    log(6, '✅ PASSED: HTML tags were stripped!', 'success');
  } else {
    log(6, '❌ FAILED: HTML tags were NOT stripped properly.', 'fail');
    if (!nameSafe) console.log(`   Expected Name: "Team alert('XSS')"`);
    if (!descSafe) console.log(`   Expected Desc: "Description with bold and alert('XSS')"`);
  }

  // Cleanup
  log(7, 'Cleaning up...', 'info');
  await deleteTempUser(tempUser.id);
  log(7, 'Temp user deleted', 'success');
}

runTest();
