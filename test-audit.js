require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const r1 = await supabase.from('admin_audit_logs').select('id').limit(1);
  console.log('admin_audit_logs error:', r1.error?.message);
  
  const r2 = await supabase.from('admin_activity_logs').select('id').limit(1);
  console.log('admin_activity_logs error:', r2.error?.message);
}
check();
