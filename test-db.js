require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('Checking system_flags...');
  const res1 = await supabase.from('system_flags').select('*').limit(1);
  console.log('system_flags result:', res1);

  console.log('\nChecking active users (profiles.last_active_at)...');
  const res2 = await supabase.from('profiles').select('id, suspended, last_active_at, profile_completed').limit(1);
  console.log('profiles result:', res2);
  
  console.log('\nChecking user_reports...');
  const res3 = await supabase.from('user_reports').select('id').limit(1);
  console.log('user_reports result:', res3);
}

check();
