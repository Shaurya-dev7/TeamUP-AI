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

const crypto = require('crypto');

function genProfile(i) {
  const username = `demouser${String(i).padStart(2,'0')}`;
  const display_name = `Demo User ${i}`;
  const skillset = Array.from(new Set([pick(skills), pick(skills)])).slice(0,3);
  const interestset = Array.from(new Set([pick(interests), pick(interests)])).slice(0,3);
  return {
    id: crypto.randomUUID(),
    username,
    display_name,
    skills: skillset,
    interests: interestset,
    college: pick(colleges),
    workplace: pick(workplaces),
    bio: `Hi, I'm ${display_name}. I like ${interestset.join(', ')} and work on ${skillset.join(', ')}.`,
    created_at: new Date().toISOString(),
    is_demo: true,
  }
}

async function main(){
  const profiles = [];
  for(let i=1;i<=50;i++) profiles.push(genProfile(i));
  // Attempt upsert; if PostgREST complains about missing columns in schema cache,
  // strip those keys from the payload and retry until successful.
  let payload = profiles.map((p) => ({ ...p }));
  let conflictKey = 'id';
  for (let attempt = 0; attempt < 6; attempt++) {
    // If `profiles.id` exists and there's a foreign key to `auth.users(id)`,
    // ensure matching users exist by creating demo users with the same id.
    if (conflictKey === 'username') {
      for (const p of payload) {
        if (p.id) {
          console.log('Creating admin user for id=', p.id, 'email=', `${p.username}@demo.local`);
          try {
            // Use Supabase Admin REST endpoint to create a user
            const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SERVICE_ROLE}`,
                apikey: SERVICE_ROLE,
              },
              body: JSON.stringify({
                id: p.id,
                email: `${p.username}@demo.local`,
                password: 'DemoPass123!',
                user_metadata: { display_name: p.display_name },
              }),
            });
            const txt = await res.text();
            if (!res.ok) {
              console.error('admin create user failed:', res.status, txt);
            } else {
              console.log('admin create user ok:', txt);
            }
          } catch (uErr) {
            console.error('createUser error:', uErr?.message || uErr);
          }
        }
      }
    }

    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: conflictKey });
    if (!error) {
      console.log('Seeded profiles:', data?.length ?? payload.length);
      process.exit(0);
    }

    // If error indicates missing column, remove that property and retry
    const msg = (error && error.message) || '';
    const m = msg.match(/Could not find the '([a-zA-Z0-9_]+)' column/);
    if (m && m[1]) {
      const col = m[1];
      console.warn(`Schema cache missing column '${col}', removing from payload and retrying`);
      payload = payload.map((p) => {
        const copy = { ...p };
        delete copy[col];
        return copy;
      });
      // small delay before retry
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    // Handle invalid uuid for id primary key: drop `id` and switch conflict key to `username`
    if (/invalid input syntax for type uuid/i.test(msg) || /invalid input syntax for type uuid:/.test(msg)) {
      console.warn('Detected UUID type error for `id` column — removing id from payload and switching conflict key to `username`.');
      payload = payload.map((p) => {
        const copy = { ...p };
        delete copy.id;
        return copy;
      });
      conflictKey = 'username';
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    // Handle foreign key errors where profiles.id references auth.users(id)
    if (error && error.code === '23503' || /violates foreign key constraint/i.test(msg)) {
      console.warn('Foreign key constraint error detected. Attempting to create matching auth users...');
      for (const p of payload) {
        if (p.id) {
          try {
            console.log('Creating admin user for id=', p.id, 'email=', `${p.username}@demo.local`);
            const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SERVICE_ROLE}`,
                apikey: SERVICE_ROLE,
              },
              body: JSON.stringify({
                id: p.id,
                email: `${p.username}@demo.local`,
                password: 'DemoPass123!',
                user_metadata: { display_name: p.display_name },
              }),
            });
            const txt = await res.text();
            if (!res.ok) console.error('admin create user failed:', res.status, txt);
            else console.log('admin create user ok:', txt);
          } catch (uErr) {
            console.error('createUser error:', uErr?.message || uErr);
          }
        }
      }
      // small delay and retry
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    console.error('Seed error:', error);
    process.exit(1);
  }

  console.error('Seed failed after retries');
  process.exit(1);
}

main();
