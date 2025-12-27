// Direct test script that connects to Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

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

async function testUsernames() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    return;
  }

  if (!serviceKey && !anonKey) {
    console.error('❌ Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY found');
    return;
  }

  const supabase = createClient(url, serviceKey || anonKey);
  const results = {
    found: [],
    notFound: [],
    errors: []
  };

  console.log('🔍 Testing usernames in database...\n');
  console.log('Using:', serviceKey ? 'SERVICE_ROLE_KEY (bypasses RLS)' : 'ANON_KEY (subject to RLS)');
  console.log('='.repeat(60));

  // Test each username
  for (const username of testUsernames) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url')
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

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get sample usernames
  const { data: sampleProfiles } = await supabase
    .from('profiles')
    .select('username')
    .limit(20);

  // Print results
  console.log(`\n📊 Total profiles in database: ${totalCount || 0}`);
  console.log(`✅ Found: ${results.found.length}/${testUsernames.length}`);
  console.log(`❌ Not found: ${results.notFound.length}/${testUsernames.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}\n`);

  if (results.found.length > 0) {
    console.log('✅ FOUND PROFILES:');
    console.log('-'.repeat(60));
    results.found.forEach((p, i) => {
      console.log(`${i + 1}. @${p.username}`);
      if (p.display_name) console.log(`   Name: ${p.display_name}`);
      if (p.bio) console.log(`   Bio: ${p.bio?.substring(0, 50)}...`);
      console.log(`   ID: ${p.id}`);
      console.log('');
    });
  }

  if (results.notFound.length > 0) {
    console.log('❌ NOT FOUND:');
    console.log('-'.repeat(60));
    results.notFound.forEach((username, i) => {
      console.log(`${i + 1}. @${username}`);
    });
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('⚠️  ERRORS:');
    console.log('-'.repeat(60));
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. @${err.username}: ${err.error} (${err.code || 'N/A'})`);
    });
    console.log('');
  }

  if (sampleProfiles && sampleProfiles.length > 0) {
    console.log('📋 Sample usernames in database (first 20):');
    console.log('-'.repeat(60));
    sampleProfiles.forEach((p, i) => {
      console.log(`${i + 1}. @${p.username}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

testUsernames().catch(console.error);

