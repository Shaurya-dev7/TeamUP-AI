
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const HACK_CLUB_API = 'https://hackathons.hackclub.com/api/events/upcoming';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function syncHackClubEvents() {
  console.log('--- Starting Hack Club Sync (Robust Mode) ---');
  
  try {
    // 1. Fetch Existing Events (to map IDs manually)
    // This avoids guessing the exact 'onConflict' constraint name for (title, start, source)
    console.log('Fetching existing Hack Club events from DB...');
    const { data: existingEvents, error: fetchError } = await supabase
        .from('events')
        .select('id, title, start_date, source')
        .eq('source', 'hackclub');
    
    if (fetchError) throw fetchError;

    // Map: "lower(title)|start_date" -> UUID
    const existingMap = new Map();
    (existingEvents || []).forEach(e => {
        const key = `${e.title.toLowerCase().trim()}|${e.start_date}`;
        existingMap.set(key, e.id);
    });
    console.log(`Found ${existingMap.size} existing events in DB.`);

    // 2. Fetch New Data
    console.log(`Fetching events from ${HACK_CLUB_API}...`);
    const response = await fetch(HACK_CLUB_API);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    
    const rawEvents = await response.json();
    console.log(`Fetched ${rawEvents.length} raw events.`);

    // 3. Normalize & Attach IDs
    const upsertPayload = [];
    
    for (const event of rawEvents) {
         // Validation
         if (!event.name || !event.start || !event.end || !event.website) continue;

         const start = new Date(event.start);
         const end = new Date(event.end);
         const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;

         let mode = 'offline';
         const locationLower = (event.location || '').toLowerCase();
         if (!event.location || locationLower.includes('online')) mode = 'online';
         const finalLocation = event.location || 'Online';

         const normalizedTitle = event.name.trim();
         // Generate Key to check existence
         // Note: We ignore "source" in the key because we filtered DB by source='hackclub' already
         const key = `${normalizedTitle.toLowerCase()}|${event.start}`;
         
         const payload = {
            title: normalizedTitle,
            description: "Student hackathon by Hack Club",
            start_date: event.start,
            end_date: event.end,
            duration_days: durationDays,
            mode: mode,
            location: finalLocation,
            cash_prize: null,
            prize_text: "Prizes & swag available",
            organizer: "Hack Club",
            eligibility: "Students",
            team_size: "1–4",
            difficulty: "beginner",
            source: "hackclub",
            redirect_url: event.website,
            logo: event.logo || null,
         };

         // If exists, attach ID to perform UPDATE. If not, no ID = INSERT.
         if (existingMap.has(key)) {
             payload.id = existingMap.get(key);
         }

         upsertPayload.push(payload);
    }

    console.log(`Prepared ${upsertPayload.length} events for upsert.`);

    if (upsertPayload.length === 0) {
        console.log('No valid events to sync.');
        return;
    }

    // 4. Perform Upsert (using ID as conflict target implicitly)
    const { data: result, error: upsertError } = await supabase
      .from('events')
      .upsert(upsertPayload)
      .select();

    if (upsertError) throw upsertError;

    console.log(`Successfully synced ${result?.length || 0} events.`);
    console.log('--- Sync Complete ---');

  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

syncHackClubEvents();
