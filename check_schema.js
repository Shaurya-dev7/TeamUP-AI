
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking events table schema...');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching events:', error);
  } else if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Found columns:', columns.join(', '));
    
    const required = ['view_count', 'click_count', 'is_featured'];
    const missing = required.filter(c => !columns.includes(c));
    
    if (missing.length > 0) {
        console.log('❌ MISSING COLUMNS:', missing.join(', '));
    } else {
        console.log('✅ All analytic columns present.');
    }
  } else {
      console.log('⚠️ Events table found but empty. Cannot confirm columns strictly.');
      // Try insert/delete to check if we can write to "view_count"? No, safer to just assume missing if empty, or try to select specific columns.
      console.log('Attempting to select specific columns to verify existence...');
      const { error: colError } = await supabase.from('events').select('view_count, click_count, is_featured').limit(1);
      if (colError) {
          console.log('❌ Columns likely missing. Error:', colError.message);
      } else {
          console.log('✅ Columns exist (query succeeded).');
      }
  }
}

checkSchema();
