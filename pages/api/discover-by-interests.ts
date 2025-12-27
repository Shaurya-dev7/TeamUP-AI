import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { user_id, limit = 20 } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const supabase = createServiceClient();

    // Get user's interests
    const { data: userInterests, error: interestsError } = await supabase
      .from('profile_interests')
      .select('interest_id, interests(name)')
      .eq('profile_id', user_id);

    if (interestsError) {
      console.error('Interests error:', interestsError);
      return res.status(500).json({ error: 'Failed to fetch user interests', details: interestsError.message, code: interestsError.code });
    }

    // If user has no interests, return empty
    if (!userInterests || userInterests.length === 0) {
      return res.status(200).json({ recommendations: [], message: 'No interests found. Add interests to your profile for better recommendations.' });
    }

    const userInterestIds = userInterests.map((ui: any) => ui.interest_id);

    // Find profiles with matching interests
    const { data: matchingInterests, error: matchError } = await supabase
      .from('profile_interests')
      .select('profile_id, interest_id, interests(name)')
      .in('interest_id', userInterestIds)
      .neq('profile_id', user_id);

    if (matchError) {
      console.error('Match error:', matchError);
      return res.status(500).json({ error: 'Failed to find matching profiles', details: matchError.message, code: matchError.code });
    }

    if (!matchingInterests || matchingInterests.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // Group by profile and collect matching interests
    const profileInterestMap = new Map<string, any[]>();
    const profileIdsSet = new Set<string>();
    
    (matchingInterests || []).forEach((item: any) => {
      const profileId = item.profile_id;
      profileIdsSet.add(profileId);
      if (!profileInterestMap.has(profileId)) {
        profileInterestMap.set(profileId, []);
      }
      profileInterestMap.get(profileId)!.push(item.interests?.name);
    });

    // Get all unique profile IDs
    const profileIds = Array.from(profileIdsSet);
    
    // Fetch profile details - use * to get all columns
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', profileIds);

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return res.status(500).json({ error: 'Failed to fetch profiles', details: profilesError.message, code: profilesError.code });
    }

    // Combine profile data with matching interests - map to consistent structure
    const profileMap = new Map();
    (profilesData || []).forEach((profile: any) => {
      const matchingInterestsList = profileInterestMap.get(profile.id) || [];
      profileMap.set(profile.id, {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name || profile.name || profile.full_name || null,
        bio: profile.bio || profile.description || null,
        avatar_url: profile.avatar_url || profile.avatar || null,
        matching_interests: matchingInterestsList,
        match_count: matchingInterestsList.length
      });
    });

    // Get follower counts for each profile
    const { data: followerCounts } = await supabase
      .from('follows')
      .select('following_id')
      .in('following_id', profileIds);

    const followerMap = new Map();
    (followerCounts || []).forEach((fc: any) => {
      followerMap.set(fc.following_id, (followerMap.get(fc.following_id) || 0) + 1);
    });

    // Add follower counts and sort by match count, then followers
    const recommendations = Array.from(profileMap.values())
      .map((p: any) => ({
        ...p,
        followers_count: followerMap.get(p.id) || 0
      }))
      .sort((a: any, b: any) => {
        // Sort by match count first, then by followers
        if (b.match_count !== a.match_count) {
          return b.match_count - a.match_count;
        }
        return b.followers_count - a.followers_count;
      })
      .slice(0, limit);

    res.json({ recommendations });
  } catch (err: any) {
    console.error('discover-by-interests handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

