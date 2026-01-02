
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
    const now = new Date().toISOString();
    console.log(`Checking events at: ${now}`);

    const { data: all, error } = await supabase.from('events').select('id, title, start_date, end_date');
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total Events: ${all.length}`);

    const trending = all.filter(e => e.end_date >= now);
    console.log(`Trending Candidates (end >= now): ${trending.length}`);

    const live = all.filter(e => e.start_date <= now && e.end_date >= now);
    console.log(`Live (start <= now <= end): ${live.length}`);

    const upcoming = all.filter(e => e.start_date > now);
    console.log(`Upcoming (start > now): ${upcoming.length}`);

    if (trending.length === 0) {
        console.log("WARNING: No events match Trending criteria. All events are in the past.");
        console.log("Sample event dates:", all.slice(0, 3).map(e => `${e.title}: ${e.end_date}`));
    }
}

checkEvents();
