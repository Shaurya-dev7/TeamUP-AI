import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, memberIds } = req.body;
    
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Group name is required' });
    if (!Array.isArray(memberIds) || memberIds.length === 0) return res.status(400).json({ error: 'At least one member is required' });

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
        conversation_id: chat.id,
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

    // Initial system message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: chat.id,
      sender_id: userId,
      content: `created group "${name}"`,
      message_type: 'text'
    } as any);

    if (msgError) {
        // Log but don't fail
      console.error('Error inserting initial group message:', msgError);
    }

    return res.status(200).json({ chat });
  } catch (err) {
    console.error('/api/create-group-chat unexpected error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
