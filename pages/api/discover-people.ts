import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

// GET: /api/discover-people?limit=10
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const supabase = createServiceClient();

    // Get random or popular profiles - use * to get all columns
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Discover people error:', error);
      return res.status(500).json({ error: 'Failed to get profiles', details: error.message, code: error.code });
    }

    if (!profiles || profiles.length === 0) {
      console.warn('No profiles found in discover-people');
      return res.json({ profiles: [] });
    }

    // Map to consistent structure
    const mappedProfiles = profiles.map((p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name || p.name || p.full_name || null,
      bio: p.bio || p.description || null,
      avatar_url: p.avatar_url || p.avatar || null
    }));

    res.json({ profiles: mappedProfiles });
  } catch (err: any) {
    console.error('discover-people handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
