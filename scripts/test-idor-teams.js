/**
 * IDOR (Insecure Direct Object Reference) Security Test
 * 
 * Tests whether User B can access/modify User A's resources using their ID.
 * 
 * Test Scenario:
 * 1. User A logs in and creates a team
 * 2. User B logs in with different credentials
 * 3. User B attempts to PATCH User A's team (should fail with 403)
 * 4. User B attempts to DELETE User A's team (should fail with 403)
 * 
 * Usage:
 *   node scripts/test-idor-teams.js
 * 
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key
 *   TEST_USER_A_EMAIL - Email for User A (team owner)
 *   TEST_USER_A_PASSWORD - Password for User A
 *   TEST_USER_B_EMAIL - Email for User B (attacker)
 *   TEST_USER_B_PASSWORD - Password for User B
 *   API_BASE_URL - Base URL of API (default: http://localhost:3000)
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// User A - the resource owner
const USER_A_EMAIL = process.env.TEST_USER_A_EMAIL;
const USER_A_PASSWORD = process.env.TEST_USER_A_PASSWORD;

// User B - the attacker trying to access User A's resources
const USER_B_EMAIL = process.env.TEST_USER_B_EMAIL;
const USER_B_PASSWORD = process.env.TEST_USER_B_PASSWORD;

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(step, message, status = 'info') {
  const statusColors = {
    info: colors.cyan,
    success: colors.green,
    fail: colors.red,
    warn: colors.yellow,
    attack: colors.magenta,
  };
  console.log(`${statusColors[status]}[Step ${step}]${colors.reset} ${message}`);
}

async function supabaseAuth(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/auth/v1${endpoint}`;
  return await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    },
  });
}

async function login(email, password) {
  const response = await supabaseAuth('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.message || 'Login failed');
  }

  return await response.json();
}

async function createTeam(token, teamData) {
  const response = await fetch(`${API_BASE_URL}/api/teams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(teamData),
  });

  return {
    status: response.status,
    data: await response.json().catch(() => null),
    ok: response.ok,
  };
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

  return {
    status: response.status,
    data: await response.json().catch(() => null),
    ok: response.ok,
  };
}

async function deleteTeam(token, teamId) {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return {
    status: response.status,
    data: await response.json().catch(() => null),
    ok: response.ok,
  };
}

async function getTeam(token, teamId) {
  const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return {
    status: response.status,
    data: await response.json().catch(() => null),
    ok: response.ok,
  };
}

async function runIDORTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}IDOR VULNERABILITY SECURITY TEST${colors.reset}`);
  console.log('Testing: Can User B modify User A\'s team?');
  console.log('='.repeat(60) + '\n');

  // Validate environment
  const missing = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!USER_A_EMAIL) missing.push('TEST_USER_A_EMAIL');
  if (!USER_A_PASSWORD) missing.push('TEST_USER_A_PASSWORD');
  if (!USER_B_EMAIL) missing.push('TEST_USER_B_EMAIL');
  if (!USER_B_PASSWORD) missing.push('TEST_USER_B_PASSWORD');

  if (missing.length > 0) {
    console.error(`${colors.red}ERROR: Missing environment variables:${colors.reset}`);
    missing.forEach(v => console.error(`  - ${v}`));
    process.exit(1);
  }

  let userAToken = null;
  let userBToken = null;
  let teamId = null;
  let vulnerabilityFound = false;

  // Step 1: Login as User A (resource owner)
  log(1, `Logging in as User A (${USER_A_EMAIL})...`);
  try {
    const loginData = await login(USER_A_EMAIL, USER_A_PASSWORD);
    userAToken = loginData.access_token;
    log(1, 'User A logged in successfully', 'success');
  } catch (err) {
    log(1, `User A login failed: ${err.message}`, 'fail');
    process.exit(1);
  }

  // Step 2: User A creates a team
  log(2, 'User A creating a new team...');
  const teamData = {
    name: `IDOR-Test-Team-${Date.now()}`,
    description: 'This team is for IDOR security testing',
    goal: 'Security Testing',
    max_members: 5,
    join_mode: 'closed',
  };

  try {
    const createResult = await createTeam(userAToken, teamData);
    
    if (!createResult.ok) {
      log(2, `Team creation failed: ${JSON.stringify(createResult.data)}`, 'fail');
      process.exit(1);
    }

    teamId = createResult.data.team?.id || createResult.data.id;
    log(2, `User A created team: ${teamId}`, 'success');
    console.log(`   Team name: "${teamData.name}"`);
  } catch (err) {
    log(2, `Team creation error: ${err.message}`, 'fail');
    process.exit(1);
  }

  // Step 3: Login as User B (attacker)
  log(3, `Logging in as User B (${USER_B_EMAIL})...`);
  try {
    const loginData = await login(USER_B_EMAIL, USER_B_PASSWORD);
    userBToken = loginData.access_token;
    log(3, 'User B (attacker) logged in successfully', 'success');
  } catch (err) {
    log(3, `User B login failed: ${err.message}`, 'fail');
    process.exit(1);
  }

  // Step 4: User B attempts to VIEW User A's team
  log(4, `User B attempting to GET team ${teamId}...`, 'attack');
  try {
    const getResult = await getTeam(userBToken, teamId);
    log(4, `GET /api/teams/${teamId} returned: HTTP ${getResult.status}`, 
        getResult.status === 200 ? 'warn' : 'success');
    
    if (getResult.ok) {
      console.log('   ⚠️  User B can view team details (may be intentional for discovery)');
      // Check if sensitive member data is exposed
      if (getResult.data?.team?.members) {
        console.log(`   ${colors.yellow}WARNING: Member list exposed to non-member${colors.reset}`);
      }
    }
  } catch (err) {
    log(4, `GET error: ${err.message}`, 'info');
  }

  // Step 5: User B attempts to PATCH User A's team (IDOR test)
  log(5, `User B attempting to PATCH team ${teamId}...`, 'attack');
  try {
    const patchResult = await patchTeam(userBToken, teamId, {
      name: 'HACKED-BY-USER-B',
      description: 'This team was modified by an unauthorized user!',
    });

    log(5, `PATCH /api/teams/${teamId} returned: HTTP ${patchResult.status}`, 
        patchResult.status === 403 || patchResult.status === 401 ? 'success' : 'fail');
    
    console.log(`   Response: ${JSON.stringify(patchResult.data)}`);

    if (patchResult.ok) {
      vulnerabilityFound = true;
      log(5, `${colors.red}CRITICAL: User B successfully modified User A's team!${colors.reset}`, 'fail');
    } else {
      log(5, 'PATCH correctly rejected', 'success');
    }
  } catch (err) {
    log(5, `PATCH error: ${err.message}`, 'info');
  }

  // Step 6: User B attempts to DELETE User A's team (IDOR test)
  log(6, `User B attempting to DELETE team ${teamId}...`, 'attack');
  try {
    const deleteResult = await deleteTeam(userBToken, teamId);

    log(6, `DELETE /api/teams/${teamId} returned: HTTP ${deleteResult.status}`,
        deleteResult.status === 403 || deleteResult.status === 401 ? 'success' : 'fail');
    
    console.log(`   Response: ${JSON.stringify(deleteResult.data)}`);

    if (deleteResult.ok) {
      vulnerabilityFound = true;
      log(6, `${colors.red}CRITICAL: User B successfully deleted User A's team!${colors.reset}`, 'fail');
    } else {
      log(6, 'DELETE correctly rejected', 'success');
    }
  } catch (err) {
    log(6, `DELETE error: ${err.message}`, 'info');
  }

  // Step 7: Verify team still exists and is unmodified (cleanup check)
  log(7, 'Verifying team integrity with User A\'s token...');
  try {
    const verifyResult = await getTeam(userAToken, teamId);
    
    if (verifyResult.ok) {
      const team = verifyResult.data.team;
      const wasModified = team.name === 'HACKED-BY-USER-B';
      
      if (wasModified) {
        vulnerabilityFound = true;
        log(7, `${colors.red}Team was modified by unauthorized user!${colors.reset}`, 'fail');
      } else {
        log(7, `Team integrity verified: "${team.name}"`, 'success');
      }
    } else if (verifyResult.status === 404) {
      vulnerabilityFound = true;
      log(7, `${colors.red}Team was deleted by unauthorized user!${colors.reset}`, 'fail');
    }
  } catch (err) {
    log(7, `Verification error: ${err.message}`, 'warn');
  }

  // Cleanup: Delete the test team using User A's token
  log(8, 'Cleanup: Deleting test team with User A\'s token...');
  try {
    const cleanupResult = await deleteTeam(userAToken, teamId);
    if (cleanupResult.ok) {
      log(8, 'Test team cleaned up successfully', 'success');
    } else {
      log(8, `Cleanup returned HTTP ${cleanupResult.status}`, 'warn');
    }
  } catch (err) {
    log(8, `Cleanup error: ${err.message}`, 'warn');
  }

  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (vulnerabilityFound) {
    console.log(`${colors.red}❌ IDOR VULNERABILITY: YES${colors.reset}`);
    console.log(`${colors.red}User B was able to access/modify User A's resources!${colors.reset}`);
    console.log('\nRecommendations:');
    console.log('  1. Verify resource ownership in ALL mutating endpoints');
    console.log('  2. Check user_id against the resource owner before PATCH/DELETE');
    console.log('  3. Add authorization middleware for all protected routes');
    console.log('  4. Review RLS policies for server-side enforcement');
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ IDOR VULNERABILITY: NO${colors.reset}`);
    console.log(`${colors.green}Authorization checks correctly prevent cross-user access.${colors.reset}`);
    console.log('\nThe application properly validates:');
    console.log('  - User must be team leader/co-leader to PATCH');
    console.log('  - User must be team leader to DELETE');
    process.exit(0);
  }
}

// Run the test
runIDORTest().catch(err => {
  console.error(`${colors.red}Unhandled error: ${err.message}${colors.reset}`);
  process.exit(1);
});
