/**
 * Token Replay Attack Security Test
 * 
 * Tests whether a Supabase JWT can be reused after logout.
 * This is a critical security test - tokens SHOULD be invalidated after logout.
 * 
 * Usage:
 *   node scripts/test-token-replay.js
 * 
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon key
 *   TEST_USER_EMAIL - Email for test account
 *   TEST_USER_PASSWORD - Password for test account
 *   API_BASE_URL - Base URL of your API (default: http://localhost:3000)
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(step, message, status = 'info') {
  const statusColors = {
    info: colors.cyan,
    success: colors.green,
    fail: colors.red,
    warn: colors.yellow,
  };
  console.log(`${statusColors[status]}[Step ${step}]${colors.reset} ${message}`);
}

async function supabaseRequest(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/auth/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      ...options.headers,
    },
  });
  return response;
}

async function runSecurityTest() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}TOKEN REPLAY ATTACK SECURITY TEST${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(`${colors.red}ERROR: Missing Supabase configuration${colors.reset}`);
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error(`${colors.red}ERROR: Missing test credentials${colors.reset}`);
    console.error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables');
    process.exit(1);
  }

  let accessToken = null;
  let refreshToken = null;

  // Step 1: Log in
  log(1, 'Logging in with test credentials...');
  try {
    const loginResponse = await supabaseRequest('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      log(1, `Login failed: ${error.error_description || error.message}`, 'fail');
      process.exit(1);
    }

    const loginData = await loginResponse.json();
    accessToken = loginData.access_token;
    refreshToken = loginData.refresh_token;

    log(1, `Login successful. Token obtained (expires in ${loginData.expires_in}s)`, 'success');
    log(1, `Token prefix: ${accessToken.substring(0, 20)}...`, 'info');
  } catch (err) {
    log(1, `Login error: ${err.message}`, 'fail');
    process.exit(1);
  }

  // Step 2: Call protected endpoint (should succeed)
  log(2, `Calling protected endpoint: GET ${API_BASE_URL}/api/blocks?target=testuser`);
  try {
    const preLogoutResponse = await fetch(`${API_BASE_URL}/api/blocks?target=testuser`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    log(2, `Pre-logout API call: HTTP ${preLogoutResponse.status}`, 
        preLogoutResponse.ok ? 'success' : 'warn');

    if (!preLogoutResponse.ok) {
      const body = await preLogoutResponse.text();
      log(2, `Response: ${body}`, 'warn');
      log(2, 'Warning: API call failed before logout. Test may not be valid.', 'warn');
    }
  } catch (err) {
    log(2, `API call error: ${err.message}`, 'warn');
  }

  // Step 3: Log out
  log(3, 'Logging out user via Supabase signOut...');
  try {
    const logoutResponse = await supabaseRequest('/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    log(3, `Logout response: HTTP ${logoutResponse.status}`, 
        logoutResponse.status === 204 || logoutResponse.ok ? 'success' : 'warn');
  } catch (err) {
    log(3, `Logout error: ${err.message}`, 'warn');
  }

  // Brief delay to ensure logout propagates
  log(4, 'Waiting 2 seconds for logout to propagate...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Reuse the SAME token after logout
  log(5, 'Attempting to reuse the SAME token after logout...');
  log(5, `Token prefix: ${accessToken.substring(0, 20)}...`, 'info');

  let replaySucceeded = false;
  try {
    const postLogoutResponse = await fetch(`${API_BASE_URL}/api/blocks?target=testuser`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    log(5, `Post-logout API call: HTTP ${postLogoutResponse.status}`, 
        postLogoutResponse.status === 401 ? 'success' : 'fail');

    if (postLogoutResponse.ok || postLogoutResponse.status !== 401) {
      replaySucceeded = true;
      const body = await postLogoutResponse.text();
      log(5, `Response body: ${body}`, 'fail');
    }
  } catch (err) {
    log(5, `API call error: ${err.message}`, 'info');
  }

  // Final verdict
  console.log('\n' + '='.repeat(60));
  if (replaySucceeded) {
    console.log(`${colors.red}❌ SECURITY TEST FAILED${colors.reset}`);
    console.log(`${colors.red}Token was still accepted after logout!${colors.reset}`);
    console.log('\nThis indicates a token replay vulnerability.');
    console.log('Recommendations:');
    console.log('  1. Implement token blacklisting on logout');
    console.log('  2. Use short-lived access tokens (e.g., 15 minutes)');
    console.log('  3. Consider database-backed session validation');
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ SECURITY TEST PASSED${colors.reset}`);
    console.log(`${colors.green}Token was correctly rejected after logout.${colors.reset}`);
    console.log('\nNo token replay vulnerability detected.');
    process.exit(0);
  }
}

// Run the test
runSecurityTest().catch(err => {
  console.error(`${colors.red}Unhandled error: ${err.message}${colors.reset}`);
  process.exit(1);
});
