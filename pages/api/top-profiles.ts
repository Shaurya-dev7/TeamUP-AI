import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { toPublicUserWithMetrics } from '@/lib/dto/public-user-dto';
import { sendSafeError, logApiError } from '@/lib/utils/error-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { user_id, limit = 20 } = req.body;

  const supabase = createServiceClient();

  // Get all profiles - STRICT COLUMNS
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, name, skills, college, location')
    .limit(limit * 2); // Get more to filter

  if (profilesError) {
    logApiError('Top profiles fetch', profilesError);
    return sendSafeError(res, 500, 'internal_error');
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

  // Get following counts (who they follow)
  const { data: followingCounts } = await supabase
    .from('follows')
    .select('follower_id');

  const followingMap = new Map();
  (followingCounts || []).forEach((fc: any) => {
    followingMap.set(fc.follower_id, (followingMap.get(fc.follower_id) || 0) + 1);
  });

  // Add follower counts and sort by followers (descending)
  // Map to consistent structure using DTO (no internal IDs exposed)
  const topProfiles = (allProfiles || [])
    .filter((p: any) => !user_id || p.id !== user_id) // Exclude current user if provided
    .map((p: any) => ({
      ...toPublicUserWithMetrics(p, {
        followers_count: followerMap.get(p.id) || 0,
        following_count: followingMap.get(p.id) || 0,
      }),
      match_count: 0, // Placeholder
      matching_interests: [],
      matching_interests_count: 0
    }))
    .sort((a: any, b: any) => b.followers_count - a.followers_count)
    .slice(0, limit);

  res.json({ profiles: topProfiles });
}

