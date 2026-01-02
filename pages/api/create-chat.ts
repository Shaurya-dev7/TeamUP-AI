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

    // Check profile completeness (Minimal: Name required)
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (userProfile) {
        const { checkProfileCompleteness, INCOMPLETE_PROFILE_ERROR } = require('@/lib/profile/completeness');
        const completeness = checkProfileCompleteness(userProfile, { minimal: true });
        if (!completeness.isComplete) {
            return res.status(403).json({ 
                error: INCOMPLETE_PROFILE_ERROR,
                missing: completeness.missing,
                profile_incomplete: true
            });
        }
    }

    if (userId === otherId) return res.status(400).json({ error: "Can't create a chat with yourself" });

    // Ensure target profile exists
    const { data: targetProfile, error: pErr } = await supabase.from('profiles').select('id').eq('id', otherId).maybeSingle();
    if (pErr || !targetProfile) {
      return res.status(404).json({ error: 'Target profile not found' });
    }

    // Deduplication for Direct Chats
    try {
      // @ts-ignore
      // @ts-ignore
      // @ts-ignore
      const { data: memberships } = await (supabase as any)
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('user_id', [userId, otherId]);

      const convToMembers = new Map();
      (memberships || []).forEach((m: any) => {
        const set = convToMembers.get(m.conversation_id) || new Set();
        set.add(m.user_id);
        convToMembers.set(m.conversation_id, set);
      });

      const candidateIds = Array.from(convToMembers.entries()).filter(([_id, set]: any) => set.size === 2).map(([id]: any) => id);

      if (candidateIds.length > 0) {
        // Fetch conversations to check type='direct'
        // @ts-ignore
        const { data: convs } = await (supabase as any)
          .from('conversations')
          .select('*')
          .in('id', candidateIds)
          .eq('type', 'direct');
        
        // Also ensure member count exactly 2 for these chats
        if (convs && convs.length > 0) {
           // We found an existing direct chat
           return res.status(200).json({ chat: convs[0] });
        }
      }
    } catch (dedupErr) {
      console.error('Dedup check error:', dedupErr);
    }

    // Create new Conversation
    // @ts-ignore
    const { data: conv, error: convError } = await (supabase as any).from('conversations').insert({
        type: 'direct'
    }).select().single();

    if (convError || !conv) {
      console.error('Error creating conversation:', convError);
      return res.status(500).json({ error: 'Failed to create chat', details: convError?.message });
    }

    // Add Participants
    // @ts-ignore
    const { error: membersError } = await (supabase as any).from('conversation_participants').insert([
      { conversation_id: (conv as any).id, user_id: userId, role: 'member' },
      { conversation_id: (conv as any).id, user_id: otherId, role: 'member' }
    ]);

    if (membersError) {
      console.error('Error adding participants:', membersError);
      return res.status(500).json({ error: 'Failed to add participants', details: membersError?.message });
    }

    // Initial Message (System or Empty?) - WhatsApp doesn't really have "Chat started", but we'll add a system msg or just leave empty.
    // Let's NOT add a visible message so the chat is empty. 
    // BUT we need an `updated_at` trigger or something. The trigger handles it.
    
    return res.status(200).json({ chat: conv });
  } catch (err) {
    console.error('/api/create-chat unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
