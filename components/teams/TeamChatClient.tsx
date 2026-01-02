"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatBackground } from "@/components/chat/ChatBackground";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message, MessageBubble } from "@/components/chat/MessageBubble";
import { Loader2, ArrowLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatSidebar } from "./ChatSidebar";

interface TeamChatClientProps {
  conversationId: string;
  teamName: string;
  teamId: string;
  initialMembers: any[];
}

export default function TeamChatClient({ conversationId, teamName, teamId, initialMembers = [] }: TeamChatClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // New States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({}); // userId -> timestamp
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Init Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id || null);
    });
  }, [supabase]);

  // 2. Fetch Messages & Subscribe
  useEffect(() => {
    if (!conversationId || !userId) return;

    setLoading(true);

    // Initial Load
    const loadMessages = async () => {
      // @ts-ignore
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(username, name)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
      } else if (data) {
        const mapped: Message[] = data.map((m: any) => ({
          ...m,
          is_me: m.sender_id === userId
        }));
        setMessages(mapped);
      }
      setLoading(false);
    };

    loadMessages();

    // Messages Channel
    const messageChannel = supabase.channel(`team_chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          
          // Optimistic update might have added it already? 
          // Check if we can map sender from members list for quick display
          const sender = initialMembers.find(m => m.user_id === newMsg.sender_id);
          const completeMsg = { 
            ...newMsg, 
            is_me: newMsg.sender_id === userId,
            sender: sender ? { username: sender.username, name: sender.name } : null 
          };
          
          return [...prev, completeMsg];
        });
      })
      .subscribe();

    // Presence & Typing Channel
    const presenceChannel = supabase.channel(`presence:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const online: Record<string, any> = {};
        for (const key in newState) {
           // @ts-ignore
           newState[key].forEach(u => {
               online[u.user_id] = u;
           });
        }
        setOnlineUsers(online);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
          const { userId: typerId, username } = payload.payload;
          if (typerId === userId) return;

          setTypingUsers(prev => ({ ...prev, [typerId]: username }));
          
          // Clear after 3s
          setTimeout(() => {
              setTypingUsers(prev => {
                  const next = { ...prev };
                  delete next[typerId];
                  return next;
              });
          }, 3000);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, userId, supabase, initialMembers]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;

    setIsSending(true);
    try {
      // @ts-ignore
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: userId,
        content: input.trim(),
        message_type: 'text'
      });

      if (error) throw error;
      setInput("");
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInput(text);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
       await supabase.channel(`presence:${conversationId}`).send({
           type: 'broadcast',
           event: 'typing',
           payload: { userId, username: 'Someone' }, // Could fetch username but optional
       });
    }, 500);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full mx-auto max-w-6xl rounded-3xl border border-neutral-200/60 bg-white/80 backdrop-blur-2xl shadow-2xl dark:border-neutral-800/60 dark:bg-neutral-900/80 overflow-hidden relative">
      <ChatBackground />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Link 
            href={`/discover/teams/${teamId}`}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              {teamName}
              <span className="px-2 py-0.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs font-bold uppercase hidden sm:inline-block">
                Team Chat
              </span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
               <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               {Object.keys(onlineUsers).length} online
            </p>
          </div>
        </div>
        
        <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500 lg:hidden"
        >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative z-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <p className="text-neutral-500 font-medium">No messages yet.</p>
                    <p className="text-xs text-neutral-400">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    // @ts-ignore
                    const senderName = msg.sender?.username || "Unknown";
                    const showName = !msg.is_me && (idx === 0 || messages[idx - 1].sender_id !== msg.sender_id);
                    
                    return (
                      <MessageBubble 
                        key={msg.id}
                        message={msg}
                        isMe={!!msg.is_me}
                        senderName={senderName}
                        showName={showName}
                      />
                    );
                  })
                )}
                
                {/* Typing Indicator Bubble */}
                {Object.keys(typingUsers).length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 opacity-70">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                        </div>
                        <span className="text-xs text-neutral-400">Someone is typing...</span>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-black/20 backdrop-blur-md w-full">
                <ChatInput 
                  value={input}
                  onChange={handleTyping}
                  onSend={handleSendMessage}
                  isSending={isSending}
                  disabled={loading}
                />
              </div>
          </div>

          {/* Sidebar (Desktop: Static, Mobile: Drawer) */}
          <ChatSidebar 
             members={initialMembers}
             onlineUsers={onlineUsers}
             isOpen={isSidebarOpen}
             onClose={() => setIsSidebarOpen(false)}
             currentUserId={userId}
          />
      </div>
    </div>
  );
}
