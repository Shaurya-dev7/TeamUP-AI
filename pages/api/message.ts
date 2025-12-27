// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

// POST: { sender_id, receiver_id, content }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { sender_id, receiver_id, content } = req.body;
    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: 'sender_id, receiver_id, and content required' });
    }
    const supabase = await createClient();

    // Find existing 1:1 chat between these two users
    let chatId: string | null = null;
    const { data: chatMembers, error: chatMembersError } = await supabase
      .from('chat_members')
      .select('chat_id, profile_id');
    if (chatMembersError) {
      return res.status(500).json({ error: 'Failed to query chat members' });
    }
    // Find chat_id that has both sender and receiver as members and is not a group
    const chatIdCounts: Record<string, number> = {};
    for (const member of chatMembers || []) {
      if (member && typeof member === 'object' && ('profile_id' in member) && ('chat_id' in member)) {
        if (member.profile_id === sender_id || member.profile_id === receiver_id) {
          chatIdCounts[member.chat_id] = (chatIdCounts[member.chat_id] || 0) + 1;
        }
      }
    }

    let foundChatId: string | null = null;
    for (const [id, count] of Object.entries(chatIdCounts)) {
      if (count === 2) {
        // Check if this chat is not a group
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .select('id, is_group')
          .eq('id', id)
          .eq('is_group', false)
          .single();
        if (chat && typeof chat === 'object' && !chat.is_group && 'id' in chat) {
          foundChatId = chat.id;
          break;
        }
      }
    }
    if (foundChatId) {
      chatId = foundChatId;
    } else {
      // Create new chat
      const { data: newChat, error: newChatError } = await supabase
        .from('chats')
        .insert([{ is_group: false }])
        .select('id')
        .single();
      if (newChatError || !newChat || !newChat.id) {
        return res.status(500).json({ error: 'Failed to create chat' });
      }
      chatId = newChat.id;
      // Add both users as members
      await supabase.from('chat_members').insert([
        { chat_id: chatId, profile_id: sender_id },
        { chat_id: chatId, profile_id: receiver_id }
      ]);
    }
    // Insert message
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .insert([{ chat_id: chatId, sender_id, content }])
      .select('*')
      .single();
    if (msgError) {
      return res.status(500).json({ error: 'Failed to send message', details: msgError.message });
    }
    res.status(201).json({ message });
  } catch (err: any) {
    console.error('message handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
