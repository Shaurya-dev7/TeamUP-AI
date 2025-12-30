// Simple test - reads env vars directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = loadEnv();
const testUsernames = [
  'anay_shanker91',
  'nirvaan_choudhury13',
  'sara_behl45',
  'kiara_kakar43',
  'aniruddh_batra47',
  'mehul_krishnan41',
  'jhanvi_chaudhary18',
  'madhup_kapur27',
  'zoya_virk42'
];

async function checkUsernames() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    return;
  }

  if (!serviceKey && !anonKey) {
    console.error('❌ Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY found');
    return;
  }

  console.log('🔍 Testing usernames...\n');
  console.log('Using:', serviceKey ? 'SERVICE_ROLE_KEY ✅' : 'ANON_KEY ⚠️');
  console.log('='.repeat(60));

  const supabase = createClient(url, serviceKey || anonKey);
  const results = { found: [], notFound: [], errors: [] };

  for (const username of testUsernames) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio')
        .ilike('username', username)
        .maybeSingle();

      if (error) {
        results.errors.push({ username, error: error.message, code: error.code });
      } else if (profile) {
        results.found.push(profile);
      } else {
        results.notFound.push(username);
      }
    } catch (err) {
      results.errors.push({ username, error: err.message });
    }
  }

  const { count: totalCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: sampleProfiles } = await supabase
    .from('profiles')
    .select('username')
    .limit(20);

  console.log(`\n📊 Total profiles: ${totalCount || 0}`);
  console.log(`✅ Found: ${results.found.length}/${testUsernames.length}`);
  console.log(`❌ Not found: ${results.notFound.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}\n`);

  if (results.found.length > 0) {
    console.log('✅ FOUND:');
    results.found.forEach((p, i) => {
      console.log(`  ${i + 1}. @${p.username} - ${p.display_name || 'No name'}`);
    });
    console.log('');
  }

  if (results.notFound.length > 0) {
    console.log('❌ NOT FOUND:');
    results.notFound.forEach((username, i) => {
      console.log(`  ${i + 1}. @${username}`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORS:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. @${err.username}: ${err.error}`);
    });
    console.log('');
  }

  if (sampleProfiles && sampleProfiles.length > 0) {
    console.log('📋 Sample usernames in DB:');
    sampleProfiles.forEach((p, i) => {
      console.log(`  ${i + 1}. @${p.username}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

checkUsernames().catch(console.error);

