import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { user_id, limit = 20 } = req.body;

  const supabase = createServiceClient();

  // Get all profiles - use * to get all columns (handle different schemas)
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(limit * 2); // Get more to filter

  if (profilesError) {
    console.error('Top profiles error:', profilesError);
    return res.status(500).json({ error: 'Failed to fetch profiles', details: profilesError.message, code: profilesError.code });
  }

  if (!allProfiles || allProfiles.length === 0) {
    console.warn('No profiles found in database');
    return res.json({ profiles: [] });
  }

  // Get follower counts for all profiles
  const { data: followerCounts } = await supabase
    .from('follows')
    .select('following_id');

  const followerMap = new Map();
  (followerCounts || []).forEach((fc: any) => {
    followerMap.set(fc.following_id, (followerMap.get(fc.following_id) || 0) + 1);
  });

  // Add follower counts and sort by followers (descending)
  // Map to consistent structure (handle different column names)
  const topProfiles = (allProfiles || [])
    .filter((p: any) => !user_id || p.id !== user_id) // Exclude current user if provided
    .map((p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name || p.name || p.full_name || null,
      bio: p.bio || p.description || null,
      avatar_url: p.avatar_url || p.avatar || null,
      followers_count: followerMap.get(p.id) || 0
    }))
    .sort((a: any, b: any) => b.followers_count - a.followers_count)
    .slice(0, limit);

  res.json({ profiles: topProfiles });
}

