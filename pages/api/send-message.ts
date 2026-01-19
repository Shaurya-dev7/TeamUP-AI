import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@supabase/supabase-js';
import { logApiError } from '@/lib/utils/error-utils';

/**
 * Send Message API with Block Check
 * 
 * POST /api/send-message
 *   Body: { chat_id: string, content: string }
 * 
 * Before inserting the message:
 * - Gets all participants in the chat
 * - Checks if ANY recipient has blocked the sender
 * - If blocked: returns success (silent drop) without inserting
 * - If not blocked: inserts message normally
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { chat_id, content } = req.body;

  if (!chat_id || !content) {
    return res.status(400).json({ error: 'chat_id and content required' });
  }

  // Get sender's username
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (!senderProfile?.username) {
    return res.status(400).json({ error: 'Sender profile not found' });
  }

  const senderUsername = senderProfile.username;

  // Check profile completeness (Minimal: Name required)
  const { checkProfileCompleteness, INCOMPLETE_PROFILE_ERROR } = require('@/lib/profile/completeness');
  // Need full profile for check, senderProfile only has username currently. 
  // Optimization: Fetch full profile initially or here.
  // Since we already fetched username, let's just assume we need to fetch more or use what we have.
  // Actually, checkProfileCompleteness checks 'name'. senderProfile only has 'username'.
  // We need to fetch 'name' in the earlier query.
  
  // Refetching full profile to be safe and simple
  const { data: fullSenderProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (fullSenderProfile) {
      const completeness = checkProfileCompleteness(fullSenderProfile, { minimal: true });
      if (!completeness.isComplete) {
        return res.status(403).json({ 
            error: INCOMPLETE_PROFILE_ERROR,
            missing: completeness.missing,
            profile_incomplete: true
        });
      }
  }

  // Get all participants in this chat (excluding sender)
  const { data: participants } = await supabase
    .from('chat_members')
    .select('profile_id')
    .eq('chat_id', chat_id)
    .neq('profile_id', user.id);

  if (!participants || participants.length === 0) {
    // No other participants, just insert the message
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id,
        sender_id: user.id,
        content: content.trim()
      })
      .select('id')
      .single();

    if (msgError) {
      logApiError('Message insert (no participants)', msgError, { chat_id });
      return res.status(500).json({ error: 'Failed to send message' });
    }

    return res.json({ success: true, message_id: (message as any)?.id, delivered: true });
  }

  // Get usernames for all participants
  const participantIds = participants.map((p: any) => p.profile_id);
  const { data: participantProfiles } = await supabase
    .from('profiles')
    .select('username')
    .in('id', participantIds);

  // Check if ANY recipient has blocked the sender
  let isBlocked = false;

  for (const profile of (participantProfiles as any[] || [])) {
    const recipientUsername = profile?.username;
    if (!recipientUsername) continue;

    // Check if this recipient has blocked the sender
    const { data: blockRecord } = await (supabase as any)
      .from('blocks')
      .select('blocker_username')
      .eq('blocker_username', recipientUsername)
      .eq('blocked_username', senderUsername)
      .maybeSingle();

    if (blockRecord) {
      isBlocked = true;
      break; // No need to check further
    }
  }

  // If blocked: SILENT DROP - return success but don't insert
  if (isBlocked) {
    console.log(`Message silently dropped: ${senderUsername} is blocked`);
    return res.json({ 
      success: true, 
      message_id: 'blocked-silent-drop', 
      delivered: false 
    });
  }

  // Not blocked: insert message normally
  const { data: message, error: msgError } = await supabase
    .from('chat_messages')
    .insert({
      chat_id,
      sender_id: user.id,
      content: content.trim()
    })
    .select('id')
    .single();

  if (msgError) {
    logApiError('Message insert', msgError, { chat_id });
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.json({ success: true, message_id: (message as any)?.id, delivered: true });
}
