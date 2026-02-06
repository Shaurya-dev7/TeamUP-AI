/**
 * Message XSS Security Test
 * 
 * Verifies that the Message API sanitizes XSS payloads from content.
 * Requires two users (Sender and Receiver).
 * 
 * Usage:
 *   node scripts/test-message-xss.js
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

const fs = require('fs');

function log(step, message, status = 'info') {
  const statusColors = {
    info: colors.blue,
    success: colors.green,
    fail: colors.red,
    warn: colors.yellow,
  };
  const logMsg = `[Step ${step}] ${message}`;
  console.log(`${statusColors[status]}${logMsg}${colors.reset}`);
  fs.appendFileSync('test-output.log', logMsg + '\n');
  if (status === 'fail') console.log('See test-output.log for details if truncated');
}

async function createTempUser(role = 'Sender') {
  const email = `msg-${role.toLowerCase()}-${Date.now()}@gmail.com`;
  const password = `pass-${Date.now()}`;
  
  // Create user
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
  if (!adminResponse.ok) throw new Error(`Failed to create ${role}: ` + (adminData.msg || adminData.error_description));

  // Create Profile (Minimal for completeness check)
  // Sender NEEDS a complete profile to send messages
  await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id: adminData.id,
      username: `user_${Date.now()}_${role}`,
      name: `${role} User`,
      age: 25,
      gender: 'Other' // Minimal requirement
    })
  });

  return { email, password, id: adminData.id };
}

async function deleteTempUser(userId) {
  if (!userId) return;
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

async function sendMessage(token, receiverId, content) {
  const response = await fetch(`${API_BASE_URL}/api/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ receiver_id: receiverId, content }),
  });
  
  if (!response.ok) {
     const text = await response.text();
     const status = response.status;
     return { status, data: { error: text } };
  }
  
  const data = await response.json();
}

async function verifyMessage(token, contentSnippet) {
  // Query chats to find the message
  // Just query chat_messages directly via REST, filtering by sender?
  // User can read their own messages via RLS usually
  // But let's use the response from sendMessage if available, or just admin query for verification certainty
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages?content=like.*${contentSnippet}*&select=*&limit=1`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  
  const data = await response.json();
  return data[0];
}

async function runTest() {
  console.log('='.repeat(50));
  console.log('💬 MESSAGE XSS SANITIZATION TEST');
  console.log('='.repeat(50));

  let sender, receiver, token;

  // 1. Create Users
  try {
    sender = await createTempUser('Sender');
    receiver = await createTempUser('Receiver');
    log(1, `Created users: Sender=${sender.email}, Receiver=${receiver.email}`, 'success');
  } catch (e) {
    log(1, `Failed to create users: ${e.message}`, 'fail');
    if (sender) await deleteTempUser(sender.id);
    if (receiver) await deleteTempUser(receiver.id);
    process.exit(1);
  }

  // 2. Login Sender
  try {
    const auth = await login(sender.email, sender.password);
    token = auth.access_token;
    log(2, 'Sender logged in', 'success');
  } catch (e) {
    log(2, `Login failed: ${e.message}`, 'fail');
    await deleteTempUser(sender.id);
    await deleteTempUser(receiver.id);
    process.exit(1);
  }

  // 3. Send XSS Message
  const xssPayload = "Hello <script>alert('msg')</script> World";
  const expectedContent = "Hello alert('msg') World";
  
  log(3, `Sending message with payload: "${xssPayload}"`, 'info');

  const result = await sendMessage(token, receiver.id, xssPayload);

  if (result.status !== 201) {
    log(3, `Send message failed: ${result.status}`, 'fail');
    console.log(result.data);
    await deleteTempUser(sender.id);
    await deleteTempUser(receiver.id);
    process.exit(1);
  }
  
  log(3, 'Message sent successfully', 'success');

  // 4. Verify Sanitization
  // We can look at the response (if it returns the message)
  // response.data.message should contain the inserted row
  const returnedMsg = result.data.message;
  
  if (!returnedMsg) {
    log(4, 'API did not return message object', 'warn');
  } else {
    console.log(`   Returned Content: "${returnedMsg.content}"`);
  }

  // Double check with DB query
  const dbMsg = await verifyMessage(token, "alert('msg')");
  
  if (!dbMsg) {
    log(4, 'Could not find message in DB', 'fail');
  } else {
    console.log(`   DB Content:       "${dbMsg.content}"`);
    
    if (dbMsg.content === expectedContent) {
      log(5, '✅ PASSED: HTML tags were stripped from message!', 'success');
    } else {
      log(5, `❌ FAILED: Content mismatch. Expected "${expectedContent}"`, 'fail');
    }
  }

  // Cleanup
  log(6, 'Cleaning up...', 'info');
  await deleteTempUser(sender.id);
  await deleteTempUser(receiver.id);
  log(6, 'Temp users deleted', 'success');
}

runTest();
