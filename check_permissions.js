
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPermissions() {
    console.log("--- Checking Permissions (Anon Key) ---");

    // 1. READ (SELECT)
    console.log("Attempting READ on 'events'...");
    const { data: readData, error: readError } = await supabase
        .from('events')
        .select('id, title')
        .limit(1);

    if (readError) {
        console.error("READ FAILED:", readError);
    } else {
        console.log("READ SUCCESS. Found:", readData.length, "events.");
    }

    // 2. WRITE (UPDATE) - Should likely fail for Anon
    if (readData && readData.length > 0) {
        const targetId = readData[0].id;
        console.log(`Attempting UPDATE on event ${targetId}...`);
        
        const { error: updateError } = await supabase
            .from('events')
            .update({ title: readData[0].title }) // No effective change
            .eq('id', targetId);

        if (updateError) {
            console.log("UPDATE FAILED (Expected for Anon):", updateError.message);
        } else {
            console.warn("UPDATE SUCCESS (Active RLS might be missing or too permissive for Anon!)");
        }
    } else {
        console.log("Skipping UPDATE check (no events found to target).");
    }
}

checkPermissions();
