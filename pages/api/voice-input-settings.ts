import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * GET /api/voice-input-settings
 * Returns voice input feature settings (enabled, cooldown, rate limit)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServiceClient();

    // @ts-ignore
    const { data: settings, error } = await (supabase as any)
      .from('voice_note_settings')
      .select('enabled, cooldown_seconds, max_requests_per_minute')
      .single();

    if (error) {
      console.error('Error fetching voice input settings:', error);
      // Return defaults if table doesn't exist yet - enable by default for dev
      return res.status(200).json({
        enabled: true,
        cooldown_seconds: 30,
        max_requests_per_minute: 10
      });
    }

    return res.status(200).json(settings);
  } catch (err) {
    console.error('/api/voice-input-settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}
