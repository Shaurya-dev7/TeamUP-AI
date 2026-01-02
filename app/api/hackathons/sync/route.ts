export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

// Define types locally if not available in generated types
type HackathonInsert = {
  external_source: 'hackclub' | 'devpost';
  external_id: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  start_date: string;
  end_date: string;
  mode: 'online' | 'in-person' | 'hybrid';
  location?: string;
  platform: 'HackClub' | 'Devpost';
  cash_prize?: number;
  prize_text?: string;
  is_active: boolean;
  last_synced_at: string;
};

export async function GET() {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  
  const results = {
    hackclub: { success: 0, failed: 0 },
    devpost: { success: 0, failed: 0 },
    errors: [] as string[]
  };

  try {
    // --- 1. Fetch & Sync HackClub ---
    try {
      const hackclubRes = await fetch('https://hackathons.hackclub.com/api/events/upcoming', { 
        next: { revalidate: 0 } // No cache for sync
      });
      
      if (hackclubRes.ok) {
        const hackclubData = await hackclubRes.json();
        const normalizedHackClub: HackathonInsert[] = hackclubData.map((ev: any) => ({
          external_source: 'hackclub',
          external_id: ev.id,
          title: ev.name,
          description: `Located in ${ev.city || 'Online'}. Organized by Hack Club.`,
          url: ev.website,
          image: ev.logo || ev.banner,
          start_date: ev.start,
          end_date: ev.end,
          mode: ev.virtual ? 'online' : (ev.hybrid ? 'hybrid' : 'in-person'),
          location: ev.city ? `${ev.city}, ${ev.state || ev.countryCode}` : 'Online',
          platform: 'HackClub',
          is_active: true,
          last_synced_at: now
        }));

        // Upsert HackClub Data
        const { error } = await supabase
          .from('hackathons')
          .upsert(normalizedHackClub, { 
            onConflict: 'external_source,external_id'
          });

        if (error) throw error;
        results.hackclub.success = normalizedHackClub.length;

        // Mark missing HackClub events as inactive (optional: strictly per source)
        // For now, we only upsert active ones. To handle deletions/cancellations:
        // We could fetch ALL active hackclub events from DB, diff, and mark others inactive.
        // Assuming the API returns ALL upcoming events, any 'active' hackclub event in DB 
        // that is NOT in this list should be marked inactive? 
        // Let's implement that for robustness if performance allows.
        const activeIds = normalizedHackClub.map(h => h.external_id);
        if (activeIds.length > 0) {
            await supabase
                .from('hackathons')
                .update({ is_active: false })
                .eq('external_source', 'hackclub')
                .not('external_id', 'in', `(${activeIds.join(',')})`);
        }

      } else {
        results.errors.push(`HackClub API failed: ${hackclubRes.status}`);
      }
    } catch (err: any) {
      results.errors.push(`HackClub Sync Error: ${err.message}`);
    }

    // --- 2. Fetch & Sync Devpost ---
    try {
      // Scrape/Fetch multiple pages if needed, but for "fast" limit we'll do 60 items
      const devpostRes = await fetch('https://devpost.com/api/hackathons?page=1&per_page=60&challenge_type[]=online&challenge_type[]=in-person', {
        next: { revalidate: 0 }
      });

      if (devpostRes.ok) {
        const devpostJson = await devpostRes.json();
        const devpostData = devpostJson.hackathons || [];
        
        const normalizedDevpost: HackathonInsert[] = devpostData.map((ev: any) => {
            // Devpost prize amount is HTML string sometimes "$10,000", need parsing if we want number
            // Prompt says: cash_prize, prize_text.
            // Using a simple regex to extract max number for sorting might be good.
            let cashPrize = 0;
            if (ev.prize_amount) {
                const match = ev.prize_amount.replace(/,/g, '').match(/(\d+)/);
                if (match) cashPrize = parseInt(match[0], 10);
            }

            return {
                external_source: 'devpost',
                external_id: String(ev.id),
                title: ev.title,
                description: `Themes: ${(ev.themes || []).map((t: any) => t.name).join(', ')}`,
                url: ev.url,
                image: ev.thumbnail_url?.startsWith('//') ? `https:${ev.thumbnail_url}` : ev.thumbnail_url,
                start_date: ev.submission_period_dates ? new Date(ev.submission_period_dates.split(' - ')[0]).toISOString() : now, // heuristic
                end_date: ev.submission_period_dates ? new Date(ev.submission_period_dates.split(' - ')[1]).toISOString() : now, // heuristic
                // Actual start/end is hard in Devpost API sometimes, relying on submission period text
                mode: ev.displayed_location?.location === 'Online' ? 'online' : 'in-person', // Simplification
                location: ev.displayed_location?.location || 'Online',
                platform: 'Devpost',
                cash_prize: cashPrize,
                prize_text: ev.prize_amount,
                is_active: ev.open_state === 'open',
                last_synced_at: now
            };
        });

        const { error } = await supabase
          .from('hackathons')
          .upsert(normalizedDevpost, { 
            onConflict: 'external_source,external_id'
          });

        if (error) throw error;
        results.devpost.success = normalizedDevpost.length;
        
        // Similar cleanup for Devpost
        const activeDevpostIds = normalizedDevpost.map(h => h.external_id);
        if (activeDevpostIds.length > 0) {
             await supabase
                .from('hackathons')
                .update({ is_active: false })
                .eq('external_source', 'devpost')
                .not('external_id', 'in', `(${activeDevpostIds.join(',')})`);
        }

      } else {
        results.errors.push(`Devpost API failed: ${devpostRes.status}`);
      }
    } catch (err: any) {
      results.errors.push(`Devpost Sync Error: ${err.message}`);
    }

    return NextResponse.json({ 
        success: true, 
        results, 
        timestamp: now 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
