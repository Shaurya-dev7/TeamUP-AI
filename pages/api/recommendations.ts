import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import { getExcludedUsernames } from '@/lib/recommendations/filters';
import { calculateUserScore, getColdStartCandidates, ScoredUser } from '@/lib/recommendations/scorer';
import { checkProfileCompleteness } from '@/lib/profile/completeness';

/**
 * Recommendations API
 * 
 * GET /api/recommendations?limit=10
 * 
 * Returns ordered list of recommended users with match percentage.
 * Scores are NOT exposed - only order and match %.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServiceClient();
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Get current user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get current user's profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!currentProfile?.username) {
      return res.status(400).json({ error: 'Profile not found' });
    }

    const currentUsername = currentProfile.username;

    // Get excluded usernames (blocked, self, already following)
    const excludedUsernames = await getExcludedUsernames(currentUsername);

    // Get current user's followers and following for mutual calculation
    const { data: followersData } = await (supabase as any)
      .from('follows')
      .select('follower')
      .eq('following', currentUsername);

    const { data: followingData } = await (supabase as any)
      .from('follows')
      .select('following')
      .eq('follower', currentUsername);

    const currentFollowers = new Set<string>((followersData || []).map((r: any) => (r.follower as string)?.toLowerCase()).filter(Boolean));
    const currentFollowing = new Set<string>((followingData || []).map((r: any) => (r.following as string)?.toLowerCase()).filter(Boolean));

    // Build scoring context
    const context = {
      currentUsername,
      currentProfile,
      currentFollowers,
      currentFollowing,
    };

    // Get candidate users (limit to reasonable pool)
    // Priority: same college, same workplace, followers of followers, recent users
    const candidates: any[] = [];
    const candidateUsernames = new Set<string>();

    // 1. Same college users
    if (currentProfile.college) {
      const { data: collegeUsers } = await supabase
        .from('profiles')
        .select('*')
        .ilike('college', currentProfile.college)
        .neq('id', user.id)
        .limit(30);

      for (const u of collegeUsers || []) {
        if (!excludedUsernames.has(u.username?.toLowerCase()) && !candidateUsernames.has(u.username?.toLowerCase())) {
          candidates.push(u);
          candidateUsernames.add(u.username?.toLowerCase());
        }
      }
    }

    // 2. Same workplace users
    if ((currentProfile as any).workplace) {
      const { data: workUsers } = await supabase
        .from('profiles')
        .select('*')
        .ilike('workplace' as any, (currentProfile as any).workplace)
        .neq('id', user.id)
        .limit(20);

      for (const u of workUsers || []) {
        if (!excludedUsernames.has(u.username?.toLowerCase()) && !candidateUsernames.has(u.username?.toLowerCase())) {
          candidates.push(u);
          candidateUsernames.add(u.username?.toLowerCase());
        }
      }
    }

    // 3. Recently active/created users (fill up to 50 candidates)
    if (candidates.length < 50) {
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      for (const u of recentUsers || []) {
        if (!excludedUsernames.has(u.username?.toLowerCase()) && !candidateUsernames.has(u.username?.toLowerCase())) {
          candidates.push(u);
          candidateUsernames.add(u.username?.toLowerCase());
          if (candidates.length >= 50) break;
        }
      }
    }

    // Filter out incomplete profiles
    // Relaxed check for recommendations: We want to show people even if they don't have a perfect profile.
    // Minimal check ensures they at least have a Name/Username/Age/Gender (Basic Info)
    const validCandidates = candidates.filter(c => {
      const completeness = checkProfileCompleteness(c, { minimal: true });
      return completeness.isComplete;
    });

    // Score all valid candidates in parallel
    const scoredUsers: ScoredUser[] = await Promise.all(
      validCandidates.map(candidate => calculateUserScore(candidate, context))
    );

    // Sort by final score (descending)
    scoredUsers.sort((a, b) => b.finalScore - a.finalScore);

    // Cold-start fallback if all scores are 0 OR if results empty
    let results = scoredUsers.slice(0, limit);
    
    // Logic: If we have NO results, or the top result has 0 score, use fallback.
    // Note: If we found "Same College" people but they have 0 score (no mutuals), do we show them? Yes.
    // But if we have very few results, we should pad with fallback?
    // User requested: "no one should get no people found" -> ALWAYS return results.
    
    if (results.length === 0) {
      const coldStartUsers = await getColdStartCandidates(
        currentUsername,
        currentProfile,
        excludedUsernames,
        limit
      );

      // Filter and add match percentage for cold-start
      // Use minimal check here too
      results = coldStartUsers
        .filter(c => checkProfileCompleteness(c, { minimal: true }).isComplete)
        .map(c => ({
          username: c.username,
          profile: c,
          rawScore: 0,
          finalScore: 0,
          matchPercentage: 20, // Base match for cold-start
          topReasons: ['suggested for you'],
        }));
    }

    // Return ordered list with match percentage (NO scores exposed)
    return res.json({
      recommendations: results.map(u => ({
        id: u.profile.id, // Required for UI actions
        username: u.profile.username,
        name: u.profile.name,
        college: u.profile.college,
        workplace: u.profile.workplace,
        location: u.profile.location, // Required for UI
        avatar_url: u.profile.avatar_url, // Required for UI
        skills: u.profile.skills,
        interests: u.profile.interests,
        matchPercentage: u.matchPercentage,
        // DO NOT expose: rawScore, finalScore, topReasons
      })),
      count: results.length,
    });

  } catch (err) {
    console.error('Recommendations API error:', err);
    return res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
