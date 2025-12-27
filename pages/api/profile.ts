import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const supabase = createServiceClient();

    // Username is citext (case-insensitive), so eq should work, but use ilike for safety
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, is_demo')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile', details: error.message, code: error.code });
    }

    if (!profile) {
      console.warn(`Profile not found for username: ${username}`);
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get followers (profiles where follows.following_id = profile.id)
    const { data: followerLinks } = await supabase.from('follows').select('follower_id').eq('following_id', profile.id);
    const followerIds = (followerLinks || []).map((r: any) => r.follower_id).filter(Boolean);
    const { data: followersData } = followerIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', followerIds)
      : { data: [] };

    // Get following (profiles where follows.follower_id = profile.id)
    const { data: followingLinks } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
    const followingIds = (followingLinks || []).map((r: any) => r.following_id).filter(Boolean);
    const { data: followingData } = followingIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', followingIds)
      : { data: [] };

    // Map to consistent structure
    const followers = (followersData || []).map((p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name || p.name || p.full_name || null,
      avatar_url: p.avatar_url || p.avatar || null
    }));

    const following = (followingData || []).map((p: any) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name || p.name || p.full_name || null,
      avatar_url: p.avatar_url || p.avatar || null
    }));

    // Load interests via the join table to reflect the normalized schema
    const { data: interestRows } = await supabase
      .from('profile_interests')
      .select('interests(name)')
      .eq('profile_id', profile.id);

    const interests = (interestRows || []).map((r: any) => r.interests?.name).filter(Boolean);

    res.json({
      profile,
      followers: followers || [],
      following: following || [],
      followers_count: (followers || []).length,
      following_count: (following || []).length,
      interests,
    });
  } catch (err: any) {
    console.error('profile handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
} 
