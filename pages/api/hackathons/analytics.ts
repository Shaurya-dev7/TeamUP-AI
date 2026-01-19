
import { createServiceClient } from '@/lib/supabase/service';
import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiError } from '@/lib/utils/error-utils';

/**
 * Analytics API for public event tracking (views/clicks)
 * 
 * SECURITY NOTE: This endpoint is intentionally unauthenticated as it tracks
 * public analytics for hackathon events. The only mutation is incrementing
 * counters on public event records.
 * 
 * Rate limiting is handled by middleware.ts
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, id } = req.body;
  
  // Validate input strictly
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
  }
  
  if (type !== 'view' && type !== 'click') {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const supabase = createServiceClient();

  try {
    if (type === 'view') {
      // Atomic increment for view_count
      const { error } = await (supabase as any).rpc('increment_view_count', { row_id: id });
        
      if (error) {
         const { data } = await (supabase as any).from('events').select('view_count').eq('id', id).single();
         if (data) {
             await (supabase as any).from('events').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id);
         }
      }
    } else if (type === 'click') {
      const { error } = await (supabase as any).rpc('increment_click_count', { row_id: id });
       if (error) {
         const { data } = await (supabase as any).from('events').select('click_count').eq('id', id).single();
         if (data) {
             await (supabase as any).from('events').update({ click_count: (data.click_count || 0) + 1 }).eq('id', id);
         }
      }
    }
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
