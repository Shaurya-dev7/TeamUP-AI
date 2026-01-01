/**
 * Hard Filters for Recommendations
 * 
 * These are absolute exclusion rules - if any filter matches, the user is excluded.
 * Scores are irrelevant for filtered users.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { checkProfileCompleteness } from '@/lib/profile/completeness';

export interface FilterResult {
  excluded: boolean;
  reason?: string;
}

/**
 * Check if a user should be excluded from recommendations
 * Returns exclusion status and reason (for debugging)
 */
export async function shouldExcludeUser(
  currentUsername: string,
  candidateUsername: string,
  candidateProfile: any
): Promise<FilterResult> {
  const supabase = createServiceClient();

  // Rule 1: Cannot recommend self
  if (currentUsername.toLowerCase() === candidateUsername.toLowerCase()) {
    return { excluded: true, reason: 'self' };
  }

  // Rule 2: Incomplete profile
  const completeness = checkProfileCompleteness(candidateProfile);
  if (!completeness.isComplete) {
    return { excluded: true, reason: 'incomplete_profile' };
  }

  // Rule 3: Block check (either direction)
  const { data: blockA } = await (supabase as any)
    .from('blocks')
    .select('blocker_username')
    .eq('blocker_username', currentUsername)
    .eq('blocked_username', candidateUsername)
    .maybeSingle();

  if (blockA) {
    return { excluded: true, reason: 'blocked_by_current' };
  }

  const { data: blockB } = await (supabase as any)
    .from('blocks')
    .select('blocker_username')
    .eq('blocker_username', candidateUsername)
    .eq('blocked_username', currentUsername)
    .maybeSingle();

  if (blockB) {
    return { excluded: true, reason: 'blocked_by_candidate' };
  }

  // Rule 4: Already following
  const { data: followRecord } = await (supabase as any)
    .from('follows')
    .select('follower')
    .eq('follower', currentUsername)
    .eq('following', candidateUsername)
    .maybeSingle();

  if (followRecord) {
    return { excluded: true, reason: 'already_following' };
  }

  return { excluded: false };
}

/**
 * Get list of usernames to exclude (blocked users + already following)
 * Used for efficient batch filtering
 */
export async function getExcludedUsernames(currentUsername: string): Promise<Set<string>> {
  const supabase = createServiceClient();
  const excluded = new Set<string>();

  // Add self
  excluded.add(currentUsername.toLowerCase());

  // Get users blocked by current user
  const { data: blockedByMe } = await (supabase as any)
    .from('blocks')
    .select('blocked_username')
    .eq('blocker_username', currentUsername);

  for (const row of blockedByMe || []) {
    excluded.add((row.blocked_username as string).toLowerCase());
  }

  // Get users who blocked current user
  const { data: blockedMe } = await (supabase as any)
    .from('blocks')
    .select('blocker_username')
    .eq('blocked_username', currentUsername);

  for (const row of blockedMe || []) {
    excluded.add((row.blocker_username as string).toLowerCase());
  }

  // Get users already followed
  const { data: following } = await (supabase as any)
    .from('follows')
    .select('following')
    .eq('follower', currentUsername);

  for (const row of following || []) {
    excluded.add((row.following as string).toLowerCase());
  }

  return excluded;
}
