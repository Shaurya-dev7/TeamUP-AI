import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceClient } from '@/lib/supabase/service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, conversationId, targetUserId } = req.body;
    
    // Auth Check
    const authHeader = (req.headers.authorization as string) || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization token' });

    const supabase = createServiceClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return res.status(401).json({ error: 'Invalid token' });
    
    const userId = user.id;

    // Permissions Check
    // Get my role
    const { data: myPartecipation, error: myError } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();
    
    if (myError || !myPartecipation) {
         return res.status(403).json({ error: 'You are not a member of this chat' });
    }

    const isAdmin = myPartecipation.role === 'admin';

    if (action === 'leave') {
        // Can always leave (unless maybe last admin? - keeping it simple for now)
        // @ts-ignore
        const { error } = await supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        // System message
        // @ts-ignore
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: 'left the group',
            message_type: 'text'
        });

        return res.status(200).json({ success: true });
    }

    if (action === 'remove') {
        if (!isAdmin) return res.status(403).json({ error: 'Only admins can remove members' });
        if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

        // @ts-ignore
        const { error } = await supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', targetUserId);
        
        if (error) throw error;

         // System message
         // @ts-ignore
         await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: userId,
            content: 'removed a member',
            message_type: 'text'
        });

        return res.status(200).json({ success: true });
    }

    if (action === 'promote') {
        if (!isAdmin) return res.status(403).json({ error: 'Only admins can promote members' });
        if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

        // @ts-ignore
        const { error } = await supabase
            .from('conversation_participants')
            .update({ role: 'admin' })
            .eq('conversation_id', conversationId)
            .eq('user_id', targetUserId);
        
        if (error) throw error;

        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error('Group action failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
