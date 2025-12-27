import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { user_id, limit = 10 } = req.body;

  try {
    const supabase = createServiceClient();

    // Get user's interests if logged in
    let userInterestIds: number[] = [];
    if (user_id) {
      const { data: userInterests } = await supabase
        .from('profile_interests')
        .select('interest_id')
        .eq('profile_id', user_id);
      userInterestIds = (userInterests || []).map((ui: any) => ui.interest_id);
    }

    // Get user's following list to exclude
    let followingIds: string[] = [];
    if (user_id) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user_id);
      followingIds = (following || []).map((f: any) => f.following_id);
      followingIds.push(user_id); // Exclude self
    }

    // Build query for profiles - use * to get all columns
    let query = supabase
      .from('profiles')
      .select('*')
      .limit(limit * 3); // Get more to filter

    const { data: allProfiles, error: profilesError } = await query;
    
    // Filter out already following profiles
    const filteredProfiles = (allProfiles || []).filter((p: any) => !followingIds.includes(p.id));

    if (profilesError) {
      console.error('Suggested profiles error:', profilesError);
      return res.status(500).json({ error: 'Failed to fetch profiles', details: profilesError.message, code: profilesError.code });
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.warn('No profiles found in database for suggestions');
      return res.json({ suggestions: [] });
    }

    // Get follower counts for filtered profiles
    const profileIds = filteredProfiles.map((p: any) => p.id);
    const { data: followerCounts } = await supabase
      .from('follows')
      .select('following_id')
      .in('following_id', profileIds);

    const followerMap = new Map();
    (followerCounts || []).forEach((fc: any) => {
      followerMap.set(fc.following_id, (followerMap.get(fc.following_id) || 0) + 1);
    });

    // Get matching interests for each profile (if user has interests)
    const interestMap = new Map<string, number>();
    if (userInterestIds.length > 0 && profileIds.length > 0) {
      const { data: matchingInterests } = await supabase
        .from('profile_interests')
        .select('profile_id, interest_id')
        .in('profile_id', profileIds)
        .in('interest_id', userInterestIds);

      (matchingInterests || []).forEach((mi: any) => {
        interestMap.set(mi.profile_id, (interestMap.get(mi.profile_id) || 0) + 1);
      });
    }

    // Score and rank profiles
    const scoredProfiles = filteredProfiles.map((profile: any) => {
      const followers = followerMap.get(profile.id) || 0;
      const matchingInterests = interestMap.get(profile.id) || 0;
      
      // Scoring: high followers (weight: 3) + matching interests (weight: 5)
      const score = followers * 3 + matchingInterests * 5;
      
      return {
        ...profile,
        followers_count: followers,
        matching_interests_count: matchingInterests,
        score
      };
    });

    // Sort by score (descending) and limit - map to consistent structure
    const suggestions = scoredProfiles
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)
      .map((p: any) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name || p.name || p.full_name || null,
        bio: p.bio || p.description || null,
        avatar_url: p.avatar_url || p.avatar || null,
        followers_count: p.followers_count,
        matching_interests_count: p.matching_interests_count
      }));

    res.json({ suggestions });
  } catch (err: any) {
    console.error('suggested-for-you handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

