/* Seed script for 50 demo profiles into Supabase.

Usage:
1. Copy `.env.local.example` -> `.env.local` and fill values.
2. From project root run: `node scripts/seed_profiles.js`

This script requires the `SUPABASE_SERVICE_ROLE_KEY` env var because it writes directly to the database.
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const skills = ['Python', 'React', 'Next.js', 'Node.js', 'Machine Learning', 'UI/UX', 'Data Science', 'Marketing', 'Product']
const interests = ['AI', 'Open Source', 'Startups', 'Gaming', 'FinTech', 'HealthTech']
const colleges = ['IIT Delhi', 'IIT Bombay', 'IIIT Hyderabad', 'NIT Trichy', 'DTU', 'BITS Pilani']
const workplaces = ['Google', 'Microsoft', 'Meta', 'Startup X', 'Freelance', 'University']

function genProfile(i) {
  const username = `demouser${String(i).padStart(2,'0')}`;
  const display_name = `Demo User ${i}`;
  const skillset = Array.from(new Set([pick(skills), pick(skills)])).slice(0,3);
  const interestset = Array.from(new Set([pick(interests), pick(interests)])).slice(0,3);

  return {
    id: `demo-${username}`,
    username,
    display_name,
    skills: skillset,
    interests: interestset,
    college: pick(colleges),
    workplace: pick(workplaces),
    bio: `Hi, I'm ${display_name}. I like ${interestset.join(', ')} and work on ${skillset.join(', ')}.`,
    created_at: new Date().toISOString(),
  }
}

async function main(){
  const profiles = [];
  for(let i=1;i<=50;i++) profiles.push(genProfile(i));

  // Upsert profiles (so rerunning is safe)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id' });

  if(error){
    console.error('Seed error:', error);
    process.exit(1);
  }

  console.log('Seeded profiles:', data?.length ?? profiles.length);
  process.exit(0);
}

main();
