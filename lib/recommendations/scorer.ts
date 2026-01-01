/**
 * Point-Based Recommendation Scorer
 * 
 * TEMPORARY PRE-ML SYSTEM
 * - All scores computed on-the-fly
 * - No stored scores in database
 * - ML will replace ONLY this scoring function
 * 
 * Design: Isolated, pure(ish) functions for easy ML replacement
 */

import { createServiceClient } from '@/lib/supabase/service';
import { applyTimeDecay, getAccountAgeMultiplier, capScore, scoreToMatchPercentage, MAX_SCORE } from './decay';

// Scoring constants - easily tunable
export const SCORING_WEIGHTS = {
  MUTUAL_FOLLOWER: 5,
  PROFILE_VIEW: 2,
  SEARCH_CLICK: 3,
  CHAT_OPEN: 4,
  MESSAGE_SENT: 6,
  SAME_COLLEGE: 5,
  SAME_WORKPLACE: 3,
  SHARED_SKILL: 1,
  SHARED_INTEREST: 1,
  RECIPROCAL_VIEW: 2,  // Bonus if both viewed each other
  UNFOLLOW_PENALTY: -10,
  SKILL_INTEREST_CAP: 10,  // Max points from skills/interests
} as const;

export interface ScoredUser {
  username: string;
  profile: any;
  rawScore: number;
  finalScore: number;
  matchPercentage: number;
  topReasons: string[];  // For debugging, not exposed to client
}

export interface ScoringContext {
  currentUsername: string;
  currentProfile: any;
  currentFollowers: Set<string>;
  currentFollowing: Set<string>;
}

/**
 * Calculate recommendation score for a candidate user
 * Returns raw score, final score, and top reasons
 */
export async function calculateUserScore(
  candidate: any,
  context: ScoringContext
): Promise<ScoredUser> {
  const supabase = createServiceClient();
  const candidateUsername = candidate.username;
  let score = 0;
  const reasons: string[] = [];

  // Parallelize all DB fetches
  const [
    candidateFollowersRes,
    profileViewsRes,
    reciprocalViewRes,
    searchClicksRes,
    chatOpenRes,
    messageSentRes,
    candidateContextRes,
    startContextRes, // we might need to fetch current user context if not passed, but let's assume valid
    unfollowRes
  ] = await Promise.all([
    (supabase as any).from('follows').select('follower').eq('following', candidateUsername),
    (supabase as any).from('profile_view_events').select('created_at').eq('viewer_username', context.currentUsername).eq('viewed_username', candidateUsername).limit(10),
    (supabase as any).from('profile_view_events').select('viewer_username').eq('viewer_username', candidateUsername).eq('viewed_username', context.currentUsername).limit(1),
    (supabase as any).from('search_events').select('created_at').eq('username', context.currentUsername).eq('result_clicked_username', candidateUsername).limit(1),
    (supabase as any).from('chat_events').select('created_at').eq('opener_username', context.currentUsername).eq('target_username', candidateUsername).eq('event_type', 'chat_open').order('created_at', { ascending: false }).limit(1),
    (supabase as any).from('chat_events').select('created_at').eq('opener_username', context.currentUsername).eq('target_username', candidateUsername).eq('event_type', 'message_sent').order('created_at', { ascending: false }).limit(1),
    (supabase as any).from('user_context').select('*').eq('username', candidateUsername).maybeSingle(),
    (supabase as any).from('user_context').select('*').eq('username', context.currentUsername).maybeSingle(),
    (supabase as any).from('negative_feedback_events').select('event_type').eq('actor_username', context.currentUsername).eq('target_username', candidateUsername).eq('event_type', 'unfollow').limit(1)
  ]);

  // --- POSITIVE SIGNALS PROCESSING ---

  // 1. Mutual followers
  const candidateFollowerSet = new Set((candidateFollowersRes.data || []).map((r: any) => r.follower?.toLowerCase()));
  let mutualCount = 0;
  for (const f of context.currentFollowers) {
    if (candidateFollowerSet.has(f.toLowerCase())) {
      mutualCount++;
    }
  }
  if (mutualCount > 0) {
    score += mutualCount * SCORING_WEIGHTS.MUTUAL_FOLLOWER;
    reasons.push(`${mutualCount} mutual followers`);
  }

  // 2. Profile views
  const profileViews = profileViewsRes.data;
  if (profileViews && profileViews.length > 0) {
    let viewScore = 0;
    for (const view of profileViews) {
      viewScore += applyTimeDecay(SCORING_WEIGHTS.PROFILE_VIEW, new Date(view.created_at));
    }
    score += viewScore;
    reasons.push(`viewed ${profileViews.length}x`);
  }

  // 3. Reciprocal view
  if (reciprocalViewRes.data && reciprocalViewRes.data.length > 0 && profileViews && profileViews.length > 0) {
    score += SCORING_WEIGHTS.RECIPROCAL_VIEW;
    reasons.push('mutual profile views');
  }

  // 4. Search intent
  if (searchClicksRes.data && searchClicksRes.data.length > 0) {
    score += applyTimeDecay(SCORING_WEIGHTS.SEARCH_CLICK, new Date(searchClicksRes.data[0].created_at));
    reasons.push('searched for them');
  }

  // 5. Chat intent
  if (chatOpenRes.data && chatOpenRes.data.length > 0) {
    score += applyTimeDecay(SCORING_WEIGHTS.CHAT_OPEN, new Date(chatOpenRes.data[0].created_at));
    reasons.push('opened chat');
  }

  if (messageSentRes.data && messageSentRes.data.length > 0) {
    score += applyTimeDecay(SCORING_WEIGHTS.MESSAGE_SENT, new Date(messageSentRes.data[0].created_at));
    reasons.push('messaged them');
  }

  // 6. Shared Context
  const candidateContext = candidateContextRes.data;
  const currentContext = startContextRes.data;

  // Fallback to profile data if user_context doesn't exist
  const candidateCollege = candidateContext?.college || candidate.college;
  const candidateWorkplace = candidateContext?.workplace || candidate.workplace;
  const currentCollege = currentContext?.college || context.currentProfile?.college;
  const currentWorkplace = currentContext?.workplace || context.currentProfile?.workplace;

  // Same college (+5)
  if (candidateCollege && currentCollege && 
      candidateCollege.toLowerCase().trim() === currentCollege.toLowerCase().trim()) {
    score += SCORING_WEIGHTS.SAME_COLLEGE;
    reasons.push('same college');
  }

  // Same workplace (+3)
  if (candidateWorkplace && currentWorkplace && 
      candidateWorkplace.toLowerCase().trim() === currentWorkplace.toLowerCase().trim()) {
    score += SCORING_WEIGHTS.SAME_WORKPLACE;
    reasons.push('same workplace');
  }

  // 7. Shared skills/interests
  const candidateSkills = parseCommaSeparated(candidate.skills);
  const candidateInterests = parseCommaSeparated(candidate.interests);
  const currentSkills = parseCommaSeparated(context.currentProfile?.skills);
  const currentInterests = parseCommaSeparated(context.currentProfile?.interests);

  const sharedSkills = intersection(candidateSkills, currentSkills);
  const sharedInterests = intersection(candidateInterests, currentInterests);

  let skillInterestScore = 0;
  skillInterestScore += sharedSkills.length * SCORING_WEIGHTS.SHARED_SKILL;
  skillInterestScore += sharedInterests.length * SCORING_WEIGHTS.SHARED_INTEREST;
  skillInterestScore = Math.min(skillInterestScore, SCORING_WEIGHTS.SKILL_INTEREST_CAP);

  if (sharedSkills.length > 0) {
    score += sharedSkills.length * SCORING_WEIGHTS.SHARED_SKILL;
    reasons.push(`${sharedSkills.length} shared skills`);
  }
  if (sharedInterests.length > 0) {
    score += sharedInterests.length * SCORING_WEIGHTS.SHARED_INTEREST;
    reasons.push(`${sharedInterests.length} shared interests`);
  }

  // --- NEGATIVE SIGNALS ---

  // 8. Unfollow penalty
  if (unfollowRes.data && unfollowRes.data.length > 0) {
    score += SCORING_WEIGHTS.UNFOLLOW_PENALTY;
    reasons.push('previously unfollowed');
  }

  // --- APPLY MULTIPLIERS ---
  const accountAge = candidate.created_at ? new Date(candidate.created_at) : new Date();
  const ageMultiplier = getAccountAgeMultiplier(accountAge);
  
  const rawScore = score;
  let finalScore = score * ageMultiplier;
  finalScore = capScore(finalScore);

  return {
    username: candidateUsername,
    profile: candidate,
    rawScore,
    finalScore,
    matchPercentage: scoreToMatchPercentage(finalScore),
    topReasons: reasons.slice(0, 3),
  };
}

/**
 * Get cold-start recommendations when no scores available
 * Returns users from same college/workplace or recently active
 */
export async function getColdStartCandidates(
  currentUsername: string,
  currentProfile: any,
  excludedUsernames: Set<string>,
  limit: number = 10
): Promise<any[]> {
  const supabase = createServiceClient();
  
  // Try same college first
  if (currentProfile?.college) {
    const { data: collegeUsers } = await supabase
      .from('profiles')
      .select('*')
      .ilike('college', currentProfile.college)
      .limit(limit * 2);

    const filtered = (collegeUsers || []).filter(
      (u: any) => !excludedUsernames.has(u.username?.toLowerCase())
    );
    if (filtered.length > 0) return filtered.slice(0, limit);
  }

  // Fallback: Trusted / Oldest Users ("Top Profiles")
  // Since we lack a "follower_count" column, we use account age as a proxy for "Trusted" / "Reputation".
  // Older accounts are likely to be early adopters or foundational members.
  const { data: trustedUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true }) // Oldest first = Trusted
    .limit(limit * 3);

  return (trustedUsers || []).filter(
    (u: any) => !excludedUsernames.has(u.username?.toLowerCase())
  ).slice(0, limit);
}

// --- Helper functions ---

function parseCommaSeparated(str: string | null | undefined): string[] {
  if (!str) return [];
  return str.split(/[,;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

function intersection(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}
