import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { checkProfileCompleteness, INCOMPLETE_PROFILE_ERROR } from '@/lib/profile/completeness';
import { requireAuth } from '@/lib/utils/auth-guard';
import { MessageSchema } from '@/lib/validators/message';
import { logApiError } from '@/lib/utils/error-utils';

// POST: { receiver_id, content }
// SECURITY: sender_id is ALWAYS derived from auth token, never from body
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // SECURITY: Get sender from auth token, not request body
  const user = await requireAuth(req, res);
  if (!user) return; // 401 already sent
  
  const sender_id = user.id; // ALWAYS use auth-derived ID
  
  // Validate & Sanitize Input
  const validation = MessageSchema.safeParse(req.body);
  
  if (!validation.success) {
     return res.status(400).json({ 
       error: validation.error.issues[0].message, 
       details: validation.error.flatten() 
     });
  }
  
  const { receiver_id, content } = validation.data;
  
  // Initialize Supabase Admin Client (to bypass RLS for lookups/creations manageable by backend logic)
  // We trust the `sender_id` because we verified the token in `requireAuth`
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check sender profile completeness before allowing message
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', sender_id)
    .single();

  if (senderProfile) {
    const completeness = checkProfileCompleteness(senderProfile, { minimal: true });
    if (!completeness.isComplete) {
      return res.status(403).json({ 
        error: INCOMPLETE_PROFILE_ERROR,
        missing: completeness.missing,
        profile_incomplete: true
      });
    }
  }

  // OPTIMIZED: Find existing 1:1 chat between these two users
  // 1. Get all chat_ids where sender is a member
  const { data: senderChats, error: senderChatsError } = await supabase
    .from('chat_members')
    .select('chat_id')
    .eq('user_id', sender_id);
    
  if (senderChatsError) {
    logApiError('Fetch sender chats', senderChatsError, { sender_id });
    return res.status(500).json({ error: 'Failed to query chats' });
  }

  let chatId: string | null = null;
  const senderChatIds = (senderChats || []).map(c => c.chat_id);

  if (senderChatIds.length > 0) {
    // 2. Check if receiver is in any of these chats, AND that chat is NOT a group
    // We can join or just query chat_members again
    const { data: commonChats, error: commonChatsError } = await supabase
      .from('chat_members')
      .select('chat_id, chats!inner(is_group)')
      .eq('user_id', receiver_id)
      .in('chat_id', senderChatIds)
      .eq('chats.is_group', false) // Ensure it's 1:1
      .limit(1); // Should only be one

    if (commonChatsError) {
       // Ignore error, maybe continue to create
       console.warn("Error finding common chat", commonChatsError);
    } else if (commonChats && commonChats.length > 0) {
       chatId = commonChats[0].chat_id;
    }
  }

  // Create new chat if none found
  if (!chatId) {
    // Transaction-like operations
    const { data: newChat, error: newChatError } = await supabase
      .from('chats')
      .insert([{ is_group: false }])
      .select('id')
      .single();
      
    if (newChatError || !newChat) {
      logApiError('Create chat', newChatError);
      return res.status(500).json({ error: 'Failed to create chat' });
    }
    
    chatId = newChat.id;
    
    // Add members
    const { error: membersError } = await supabase.from('chat_members').insert([
      { chat_id: chatId, user_id: sender_id, role: 'member' },
      { chat_id: chatId, user_id: receiver_id, role: 'member' }
    ]);
    
    if (membersError) {
        logApiError('Add chat members', membersError);
        // Rollback potentially needed, but unlikely to fail if chat created
        return res.status(500).json({ error: 'Failed to add members' });
    }
  }
  
  // Insert message
  const { data: message, error: msgError } = await supabase
    .from('chat_messages')
    .insert([{ chat_id: chatId, sender_id, content }])
    .select('*')
    .single();
    
  if (msgError) {
    logApiError('Chat message insert', msgError, { chat_id: chatId });
    return res.status(500).json({ error: 'Failed to send message' });
  }
  
  res.status(201).json({ message });
}
