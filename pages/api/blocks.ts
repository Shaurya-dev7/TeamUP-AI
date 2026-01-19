import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import { logNegativeFeedback, NEGATIVE_FEEDBACK_TYPES } from '@/lib/events/logger';
import { checkProfileCompleteness, INCOMPLETE_PROFILE_ERROR } from '@/lib/profile/completeness';
import { logApiError } from '@/lib/utils/error-utils';

/**
 * Block/Unblock API
 * 
 * POST /api/blocks - Block a user
 *   Body: { blocked_username: string }
 *   Requires auth (blocker_username from session)
 * 
 * DELETE /api/blocks - Unblock a user
 *   Body: { blocked_username: string }
 *   Requires auth
 * 
 * GET /api/blocks?target=username - Check if current user blocked target
 *   Returns: { blocked: boolean, blockedBy: boolean }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceClient();

  // Get current user from auth header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify token and get user
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get current user's full profile for completeness check
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any };

  if (!currentProfile?.username) {
    return res.status(400).json({ error: 'Profile not found' });
  }

  // Check profile completeness before allowing block/unblock
  const completeness = checkProfileCompleteness(currentProfile, { minimal: true });
  if (!completeness.isComplete) {
    return res.status(403).json({ 
      error: INCOMPLETE_PROFILE_ERROR,
      missing: completeness.missing,
      profile_incomplete: true
    });
  }

  const blockerUsername = currentProfile.username;

  // Handle GET - Check block status
  if (req.method === 'GET') {
    const { target } = req.query;
    
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: 'Target username required' });
    }

    // Check if current user blocked target
    const { data: blockedByMe } = await (supabase as any)
      .from('blocks')
      .select('blocker_username')
      .eq('blocker_username', blockerUsername)
      .eq('blocked_username', target)
      .maybeSingle();

    // Check if target blocked current user
    const { data: blockedByThem } = await (supabase as any)
      .from('blocks')
      .select('blocker_username')
      .eq('blocker_username', target)
      .eq('blocked_username', blockerUsername)
      .maybeSingle();

    return res.json({
      blocked: !!blockedByMe,      // Current user has blocked target
      blockedBy: !!blockedByThem   // Current user is blocked by target
    });
  }

  // Handle POST - Block user
  if (req.method === 'POST') {
    const { blocked_username } = req.body;

    if (!blocked_username || typeof blocked_username !== 'string') {
      return res.status(400).json({ error: 'blocked_username required' });
    }

    // Cannot block yourself
    if (blocked_username.toLowerCase() === blockerUsername.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Verify target user exists
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', blocked_username)
      .maybeSingle();

    if (!targetProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert block (ignore conflicts - upsert behavior)
    const { error } = await (supabase as any)
      .from('blocks')
      .upsert(
        { 
          blocker_username: blockerUsername, 
          blocked_username: targetProfile.username 
        },
        { onConflict: 'blocker_username,blocked_username' }
      );

    if (error) {
      logApiError('Block insert', error, { blocker: blockerUsername, blocked: blocked_username });
      return res.status(500).json({ error: 'Failed to block user' });
    }

    // Auto-unfollow: Remove follow relationship in BOTH directions
    // 1. If blocker was following the blocked user, remove that
    await (supabase as any)
      .from('follows')
      .delete()
      .eq('follower', blockerUsername)
      .eq('following', targetProfile.username);

    // 2. If blocked user was following the blocker, remove that too
    await (supabase as any)
      .from('follows')
      .delete()
      .eq('follower', targetProfile.username)
      .eq('following', blockerUsername);

    // Log to ML events (fire-and-forget) - negative_feedback_events is authoritative
    logNegativeFeedback(blockerUsername, targetProfile.username, NEGATIVE_FEEDBACK_TYPES.BLOCK);

    return res.json({ 
      success: true, 
      message: `Blocked ${blocked_username}`,
      unfollowed: true // Flag indicating follow relationships were also removed
    });
  }

  // Handle DELETE - Unblock user
  if (req.method === 'DELETE') {
    const { blocked_username } = req.body;

    if (!blocked_username || typeof blocked_username !== 'string') {
      return res.status(400).json({ error: 'blocked_username required' });
    }

    const { error } = await (supabase as any)
      .from('blocks')
      .delete()
      .eq('blocker_username', blockerUsername)
      .eq('blocked_username', blocked_username);

    if (error) {
      logApiError('Unblock delete', error, { blocker: blockerUsername, blocked: blocked_username });
      return res.status(500).json({ error: 'Failed to unblock user' });
    }

    return res.json({ success: true, message: `Unblocked ${blocked_username}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
