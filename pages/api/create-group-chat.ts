import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';
import { GroupChatSchema } from '@/lib/validators/chat';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const validation = GroupChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid input', details: validation.error.flatten() });
    }
    const { name, memberIds } = validation.data;

    const authHeader = (req.headers.authorization as string) || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization token' });

    const supabase = createServiceClient();

    // Verify token corresponds to a real user
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
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

    // Create group conversation
    const { data: chat, error: chatError } = await supabase.from('conversations').insert({
        type: 'group',
        title: name,
        // icon_url: ... optional
    }).select().single();

    if (chatError || !chat) {
      console.error('Error creating group chat (service):', chatError);
      return res.status(500).json({ error: 'Failed to create group chat', details: chatError?.message });
    }

    // Add members: creator + selected members
    const allMemberIds = Array.from(new Set([userId, ...memberIds]));
    
    const membersPayload = allMemberIds.map(pid => ({
        conversation_id: (chat as any).id,
        user_id: pid,
        role: pid === userId ? 'admin' : 'member'
    }));

    const { error: membersError } = await supabase.from('conversation_participants').insert(membersPayload);
    
    if (membersError) {
      console.error('Error adding group members (service):', membersError);
      // Rollback chat if possible (manual deletion)? Use atomic logic if we could.
      // For now, return error.
      return res.status(500).json({ error: 'Failed to add group members', details: membersError?.message });
    }

    // Insert starter message (system-authored, sender_id = null)
    try {
      const { data: template } = await supabase
        .from('chat_starter_templates')
        .select('content')
        .eq('context', 'new_group_chat')
        .eq('is_active', true)
        .single();

      if (template?.content) {
        await supabase.from('messages').insert({
          conversation_id: (chat as any).id,
          sender_id: null, // System message - no sender
          content: template.content,
          message_type: 'text',
          input_method: 'keyboard'
        });
      }
    } catch (starterErr) {
      // Non-fatal: log but don't fail
      console.log('Starter message insert skipped:', starterErr);
    }

    return res.status(200).json({ chat });
  } catch (err) {
    console.error('/api/create-group-chat unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
