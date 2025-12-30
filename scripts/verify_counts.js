
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('--- Verifying Database Counts ---');
  
  // 1. Get a profile
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, username')
    .limit(2);
    
  if (pError) {
    console.error('Error fetching profiles:', pError);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found. Cannot test.');
    return;
  }
  
  const user1 = profiles[0];
  console.log(`Found User 1: ${user1.username} (${user1.id})`);
  
  // 2. Check if user1 has following/followers
  const { count: followersCount, error: fError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', user1.id);
    
  if (fError) console.error('Error counting followers:', fError);
  console.log(`DB says ${user1.username} has ${followersCount} followers.`);
  
  const { count: followingCount, error: fiError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user1.id);

  if (fiError) console.error('Error counting following:', fiError);
  console.log(`DB says ${user1.username} is following ${followingCount} users.`);

  // 3. Test the API logic specifically (simulate what api/profile does)
  console.log('\n--- Simulating API Logic ---');
  // We can't easily fetch local API from here without fetch polyfill or node 18+, assuming node environment.
  // Instead we just printed the DB truth above. 
  // If DB has counts, and check_counts.js works, then my API code (which does the exact same thing) should work.
  
  // Let's explicitly try to fetch the URL if server is running
  try {
    const apiUrl = `http://localhost:3000/api/profile?username=${user1.username}`;
    console.log(`Fetching ${apiUrl}...`);
    // Native fetch in Node 18+
    const res = await fetch(apiUrl);
    if (res.ok) {
        const json = await res.json();
        console.log('API Response:', {
            username: json.profile.username,
            followers_count: json.followers_count,
            following_count: json.following_count
        });
        
        if (json.followers_count === followersCount && json.following_count === followingCount) {
            console.log('✅ API Matches Database!');
        } else {
            console.error('❌ API Mismatch!');
        }
    } else {
        console.error('API Request Failed:', res.status, res.statusText);
    }
  } catch (e) {
      console.log('Could not hit localhost (server might not be running or node < 18). Manual check required if so.');
  }

  // 4. Force a follow relationship if none exist, for testing purposes?
  // Only if really needed. User asked "check if its working".
  // If counts are 0, we can't be 100% sure it's "working" vs "empty".
  // If we have at least 2 users, we can make user2 follow user1 temporarily?
  if (profiles.length > 1 && followersCount === 0 && followingCount === 0) {
      const user2 = profiles[1];
      console.log(`\nStats are 0. Creating temporary follow: ${user2.username} -> ${user1.username}`);
      const { error: insertError } = await supabase
        .from('follows')
        .insert({ follower_id: user2.id, following_id: user1.id });
      
      if (!insertError) {
          console.log('Follow inserted. Re-checking API...');
           try {
                const apiUrl = `http://localhost:3000/api/profile?username=${user1.username}`;
                const res = await fetch(apiUrl);
                const json = await res.json();
                console.log('API Response Modified:', {
                    followers_count: json.followers_count
                });
                // clean up
                await supabase.from('follows').delete().eq('follower_id', user2.id).eq('following_id', user1.id);
                console.log('Temporary follow removed.');
           } catch (e) {}
      } else {
          console.error('Failed to insert follow:', insertError);
      }
  }
}

verify();
