import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import { logUserInteraction, logNegativeFeedback, INTERACTION_TYPES, NEGATIVE_FEEDBACK_TYPES } from '@/lib/events/logger';
import { checkProfileCompleteness, INCOMPLETE_PROFILE_ERROR } from '@/lib/profile/completeness';

/**
 * Follow/Unfollow API (Username-based)
 * 
 * POST /api/follow
 *   Body: { following_username: string }
 *   Uses auth token to get follower_username
 * 
 * DELETE /api/follow
 *   Body: { following_username: string }
 *   Unfollows the target user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServiceClient();

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

  // Get current user's full profile for completeness check
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any };

  if (!currentProfile?.username) {
    return res.status(400).json({ error: 'Profile not found' });
  }

  // Check profile completeness before allowing follow/unfollow
  // Relaxed check: Only name/username required for following
  const completeness = checkProfileCompleteness(currentProfile, { minimal: true });
  if (!completeness.isComplete) {
    return res.status(403).json({ 
      error: INCOMPLETE_PROFILE_ERROR,
      missing: completeness.missing,
      profile_incomplete: true
    });
  }

  const followerUsername = currentProfile.username;

  // POST: Follow user
  if (req.method === 'POST') {
    const { following_username } = req.body;

    if (!following_username || typeof following_username !== 'string') {
      return res.status(400).json({ error: 'following_username required' });
    }

    // Cannot follow yourself
    if (following_username.toLowerCase() === followerUsername.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Verify target exists
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', following_username)
      .maybeSingle();

    if (!targetProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Insert follow (ON CONFLICT DO NOTHING via upsert)
    const { error } = await (supabase as any)
      .from('follows')
      .upsert(
        { follower: followerUsername, following: targetProfile.username },
        { onConflict: 'follower,following', ignoreDuplicates: true }
      );

    if (error) {
      console.error('Follow insert error:', error);
      return res.status(500).json({ error: 'Failed to follow', details: error.message });
    }

    // Log to ML events (fire-and-forget)
    logUserInteraction(followerUsername, targetProfile.username, INTERACTION_TYPES.FOLLOW);

    return res.json({ success: true, message: `Following ${following_username}` });
  }

  // DELETE: Unfollow user
  if (req.method === 'DELETE') {
    const { following_username } = req.body;

    if (!following_username || typeof following_username !== 'string') {
      return res.status(400).json({ error: 'following_username required' });
    }

    const { error } = await (supabase as any)
      .from('follows')
      .delete()
      .eq('follower', followerUsername)
      .eq('following', following_username);

    if (error) {
      console.error('Unfollow delete error:', error);
      return res.status(500).json({ error: 'Failed to unfollow', details: error.message });
    }

    // Log to ML events (fire-and-forget)
    // Log both as user_interaction AND negative_feedback (intentional duplication for ML weighting)
    logUserInteraction(followerUsername, following_username, INTERACTION_TYPES.UNFOLLOW);
    logNegativeFeedback(followerUsername, following_username, NEGATIVE_FEEDBACK_TYPES.UNFOLLOW);

    return res.json({ success: true, message: `Unfollowed ${following_username}` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
