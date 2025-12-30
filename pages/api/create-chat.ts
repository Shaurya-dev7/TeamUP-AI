import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { otherId } = req.body;
    if (!otherId || typeof otherId !== 'string') return res.status(400).json({ error: 'otherId is required' });

    const authHeader = (req.headers.authorization as string) || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization token' });

    const supabase = createServiceClient();

    // Verify token corresponds to a real user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error('Auth token invalid when calling /api/create-chat:', userError);
      return res.status(401).json({ error: 'Invalid token' });
    }
    const userId = userData.user.id;

    if (userId === otherId) return res.status(400).json({ error: "Can't create a chat with yourself" });

    // Ensure target profile exists
    const { data: targetProfile, error: pErr } = await supabase.from('profiles').select('id').eq('id', otherId).maybeSingle();
    if (pErr) {
      console.error('Error checking target profile:', pErr);
      return res.status(500).json({ error: 'Failed to check target profile' });
    }
    if (!targetProfile) return res.status(404).json({ error: 'Target profile not found' });

    // Idempotent one-to-one deduplication:
    // Find candidate chats where both users are members, verify chat is not a group and has exactly 2 members
    try {
      const { data: memberships, error: memErr } = await supabase
        .from('chat_members')
        .select('chat_id, profile_id')
        .in('profile_id', [userId, otherId]);
      if (memErr) {
        console.error('Error querying chat_members for dedup:', memErr);
        return res.status(500).json({ error: 'Failed to query chat memberships' });
      }

      const chatToMembers = new Map();
      (memberships || []).forEach((m: any) => {
        const set = chatToMembers.get(m.chat_id) || new Set();
        set.add(m.profile_id);
        chatToMembers.set(m.chat_id, set);
      });

      const candidateChatIds = Array.from(chatToMembers.entries()).filter(([_id, set]: any) => set.size === 2).map(([id]: any) => id);

      if (candidateChatIds.length > 0) {
        // Fetch candidate chats
        const { data: chatsFound, error: chatsErr } = await supabase
          .from('chats')
          .select('*')
          .in('id', candidateChatIds);
        if (chatsErr) {
          console.error('Error fetching candidate chats for dedup:', chatsErr);
          return res.status(500).json({ error: 'Failed to fetch chats for dedup' });
        }

        // Fetch members for candidate chats to ensure exactly 2 members
        const { data: membersForCandidates, error: membersErr } = await supabase
          .from('chat_members')
          .select('chat_id, profile_id')
          .in('chat_id', candidateChatIds);
        if (membersErr) {
          console.error('Error fetching members for candidate chats:', membersErr);
          return res.status(500).json({ error: 'Failed to fetch chat members' });
        }

        const membersCountMap = new Map();
        (membersForCandidates || []).forEach((m: any) => {
          const set = membersCountMap.get(m.chat_id) || new Set();
          set.add(m.profile_id);
          membersCountMap.set(m.chat_id, set);
        });

        for (const c of (chatsFound || [])) {
          if (c.is_group) continue;
          const memberSet = membersCountMap.get(c.id);
          if (memberSet && memberSet.size === 2) {
            // Return existing one-to-one chat
            return res.status(200).json({ chat: c });
          }
        }
      }
    } catch (dedupErr) {
      // Best-effort: if dedup fails for unexpected reasons, continue to create new chat
      console.error('Dedup check error, proceeding to create new chat:', dedupErr);
    }

    // Create chat and members (service role bypasses RLS)
    const { data: chat, error: chatError } = await supabase.from('chats').insert({}).select().single();
    if (chatError || !chat) {
      console.error('Error creating chat (service):', chatError);
      return res.status(500).json({ error: 'Failed to create chat', details: chatError?.message });
    }

    const { error: membersError } = await supabase.from('chat_members').insert([
      { chat_id: chat.id, profile_id: userId },
      { chat_id: chat.id, profile_id: otherId }
    ]);
    if (membersError) {
      console.error('Error adding members (service):', membersError);
      return res.status(500).json({ error: 'Failed to add chat members', details: membersError?.message });
    }

    const { error: msgError } = await supabase.from('chat_messages').insert({
      chat_id: chat.id,
      sender_id: userId,
      content: 'Chat started!'
    } as any);
    if (msgError) {
      console.error('Error inserting initial chat message (service):', msgError);
      // not fatal — continue
    }

    return res.status(200).json({ chat });
  } catch (err) {
    console.error('/api/create-chat unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
