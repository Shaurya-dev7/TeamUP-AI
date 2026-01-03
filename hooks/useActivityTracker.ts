'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

const ACTIVITY_THROTTLE = 60000; // 1 minute

export function useActivityTracker() {
  const lastUpdate = useRef<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const track = async () => {
      const now = Date.now();
      if (now - lastUpdate.current < ACTIVITY_THROTTLE) return;

      lastUpdate.current = now;

      // We only track if we have a session, but the API handles the check.
      // To save requests, we could check session here, but standard practice 
      // is to just fire the beacon if we are likely logged in.
      // However, we can use supabase client to check session quickly.
      
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      try {
        // Use sendBeacon if available for reliability on unload, else fetch
        if (navigator.sendBeacon) {
            // Need a text/plain or blob payload for sendBeacon to not require CORS preflight sometimes, 
            // but Next.js API handles JSON fine. simpler to use fetch for auth headers.
            // Actually, keep it simple with fetch.
            await fetch('/api/user/track-active', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } else {
            fetch('/api/user/track-active', { method: 'POST' });
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Track on mount
    track();

    // Track on visibility change (user comes back to tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        track();
      }
    };

    // Track on user interaction (clicks) - throttled
    const onInteraction = () => {
        track();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('click', onInteraction);
    window.addEventListener('keydown', onInteraction);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('keydown', onInteraction);
    };
  }, [supabase]);
}
