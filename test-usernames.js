// Quick test script to check if usernames exist
// Run with: node test-usernames.js

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
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  console.log('Testing usernames...\n');
  console.log('Make sure your dev server is running (npm run dev)\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/test-usernames`);
    const data = await response.json();
    
    console.log('='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total profiles in database: ${data.totalProfilesInDB || 0}`);
    console.log(`\nFound ${data.found.length} out of ${data.totalUsernames} usernames:\n`);
    
    if (data.found.length > 0) {
      console.log('✅ FOUND:');
      data.found.forEach((p, i) => {
        console.log(`  ${i + 1}. @${p.username}`);
        if (p.display_name) console.log(`     Name: ${p.display_name}`);
        if (p.bio) console.log(`     Bio: ${p.bio}`);
      });
    }
    
    if (data.notFound.length > 0) {
      console.log(`\n❌ NOT FOUND (${data.notFound.length}):`);
      data.notFound.forEach((username, i) => {
        console.log(`  ${i + 1}. @${username}`);
      });
    }
    
    if (data.errors.length > 0) {
      console.log(`\n⚠️  ERRORS (${data.errors.length}):`);
      data.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. @${err.username}: ${err.error}`);
      });
    }
    
    if (data.sampleUsernamesInDB && data.sampleUsernamesInDB.length > 0) {
      console.log(`\n📋 Sample usernames in database (first 20):`);
      data.sampleUsernamesInDB.forEach((username, i) => {
        console.log(`  ${i + 1}. @${username}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('Error testing usernames:', error.message);
    console.log('\nMake sure:');
    console.log('1. Dev server is running: npm run dev');
    console.log('2. SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
  }
}

testUsernames();

