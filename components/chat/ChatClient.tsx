"use client";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChatBackground } from "@/components/chat/ChatBackground";
import { Conversation, ConversationList } from "@/components/chat/ConversationList";
import { ChatInput } from "@/components/chat/ChatInput";
import { Message, MessageBubble } from "@/components/chat/MessageBubble";
import { X, Users, Menu, Plus, ArrowLeft, Check, UserPlus, LogOut, Shield, Crown, Trash2, Info } from "lucide-react";



// Simple Toast Notification Component
const ChatNotification = ({ message, onClose }: { message: { sender: string, text: string } | null, onClose: () => void }) => {
    if (!message) return null;
    return (
        <div className="fixed top-4 right-4 z-50 bg-white dark:bg-neutral-800 shadow-xl rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 animate-in slide-in-from-right-full fade-in duration-300 max-w-xs cursor-pointer" onClick={onClose}>
            <div className="flex justify-between items-start gap-3">
                <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">New message from {message.sender}</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-1">{message.text}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-neutral-400 hover:text-neutral-500">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default function ChatClient() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const initialUserId = searchParams ? searchParams.get("userId") : null;

    const [sessionUserId, setSessionUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
    
    // Presence State
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    
    // Notification State
    const [notification, setNotification] = useState<{ sender: string, text: string } | null>(null);

    // 1. Session Init
    useEffect(() => {
        let mounted = true;
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted && session?.user) {
                setSessionUserId(session.user.id);
            }
        };
        fetchSession();
    }, [supabase]);

    // 2. Fetch Conversations (Robust)
    const fetchConversations = useCallback(async () => {
        if (!sessionUserId) return;
        
        try {
            // @ts-ignore
            const { data: validConvs, error: partError } = await supabase
                .from('conversation_participants')
                .select(`
                    conversation_id, 
                    conversations:conversation_id (
                        id, type, title, icon_url, updated_at
                    )
                `)
                .eq('user_id', sessionUserId);

            if (partError) {
                console.error("Error fetching participants:", partError);
                throw partError;
            }

            if (!validConvs || validConvs.length === 0) {
                setConversations([]);
                setLoadingConvs(false);
                return;
            }

            const convIds = validConvs.map((vc: any) => vc.conversation_id);
            
            // Fetch Last Message
            // @ts-ignore
            const { data: lastMessages, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });
                
            if (msgError) console.error("Error fetching messages:", msgError);

            // Fetch Unread Counts
            // @ts-ignore
            const { data: unreadData, error: unreadError } = await supabase
                .from('message_status')
                .select(`message_id, status, messages!inner(conversation_id)`)
                .eq('user_id', sessionUserId)
                .neq('status', 'read');

            if (unreadError) console.error("Error fetching unread:", unreadError);

            // Fetch Participants
            // @ts-ignore
            const { data: allParticipants, error: allPartError } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id, role, profiles(id, username, name)')
                .in('conversation_id', convIds);

            if (allPartError) console.error("Error fetching all participants:", allPartError);

            const loadedConvs: Conversation[] = validConvs.map((row: any) => {
                // @ts-ignore
                const c = row.conversations;
                if (!c) return null;

                // Find explicit last message
                // This logic is imperfect efficiently but robust for correct data
                // @ts-ignore
                const msgsForThis = (lastMessages as any[])?.filter((m: any) => m.conversation_id === c.id) || [];
                const myLastMsg = msgsForThis[0];

                // @ts-ignore
                const unreadForThis = (unreadData as any[])?.filter((u: any) => u.messages.conversation_id === c.id).length || 0;

                // @ts-ignore
                const parts = (allParticipants as any[])?.filter((p: any) => p.conversation_id === c.id) || [];
                
                let otherUser = undefined;
                let participants: any[] = [];

                if (c.type === 'direct') {
                    const found = parts.find((p: any) => p.user_id !== sessionUserId);
                    if (found && found.profiles) {
                        otherUser = { ...found.profiles, is_online: false };
                    }
                } else {
                    // Map for groups: ensure p.user is populated from p.profiles
                    participants = parts.map((p: any) => ({
                        user_id: p.user_id,
                        role: p.role,
                        user: p.profiles
                    }));
                }

                return {
                    id: c.id, type: c.type, title: c.title, icon_url: c.icon_url, updated_at: c.updated_at,
                    last_message: myLastMsg ? {
                        content: myLastMsg.content || (myLastMsg.message_type === 'image' ? 'Image' : 'File'),
                        sender_id: myLastMsg.sender_id,
                        created_at: myLastMsg.created_at,
                        status: 'sent'
                    } : undefined,
                    unread_count: unreadForThis,
                    other_user: otherUser,
                    participants: participants
                };
            }).filter(Boolean) as Conversation[];

            loadedConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            
            setConversations(loadedConvs);
            setLoadingConvs(false);
        } catch (e) {
            console.error("Fetch convs error object:", e);
            console.error("Fetch convs error string:", JSON.stringify(e, null, 2));
            setLoadingConvs(false);
        }
    }, [sessionUserId, supabase]);

    // Initial Load
    useEffect(() => {
        if (sessionUserId) fetchConversations();
    }, [sessionUserId, fetchConversations]);

    // Presence (Online Status)
    useEffect(() => {
        if (!sessionUserId) return;

        const presenceChannel = supabase.channel('online-users');
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState();
                const userIds = new Set<string>();
                for (const key in newState) {
                     // Check known structure, usually { user_id: ... }
                     // If we are tracking by user_id
                     // For our simple case, let's assume we send user_id in payload
                     newState[key].forEach((payload: any) => {
                         if (payload.user_id) userIds.add(payload.user_id);
                     });
                }
                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: sessionUserId, online_at: new Date().toISOString() });
                }
            });

        return () => { supabase.removeChannel(presenceChannel); };
    }, [sessionUserId, supabase]);

    // Sync Online Status to Conversations
    const conversationsWithPresence = useMemo(() => {
        return conversations.map(c => {
            if (c.type === 'direct' && c.other_user) {
                return {
                    ...c,
                    other_user: {
                        ...c.other_user,
                        is_online: onlineUsers.has(c.other_user.id)
                    }
                };
            }
            return c;
        });
    }, [conversations, onlineUsers]);


    // 3. Active Chat Messages & Read Receipts
    useEffect(() => {
        if (!selectedConvId || !sessionUserId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
             // @ts-ignore
             const { data, error } = await supabase
                .from('messages')
                .select('*, sender:profiles(username)')
                .eq('conversation_id', selectedConvId)
                .order('created_at', { ascending: true });
            
             if (data) {
                 // Mark unread as read immediately
                 // @ts-ignore
                 await supabase.from('message_status')
                    // @ts-ignore
                    .update({ status: 'read', updated_at: new Date().toISOString() })
                    .eq('user_id', sessionUserId)
                    .in('message_id', (data as any[]).map((m: any) => m.id))
                    .neq('status', 'read'); // Only update if not already read

                 const mapped: Message[] = (data as any[]).map((m: any) => ({
                    ...m,
                    is_me: m.sender_id === sessionUserId
                 }));
                 setMessages(mapped);
                 
                 // Fetch latest statuses for MY messages to show ticks
                 // @ts-ignore
                 const { data: statusData } = await supabase
                    .from('message_status')
                    .select('message_id, status')
                    .in('message_id', mapped.filter(m => m.is_me).map(m => m.id));
                 
                 if (statusData) {
                     setMessages(prev => prev.map(m => {
                         if (!m.is_me) return m;
                         // For 1:1, usually 1 status row per message per recipient.
                         // We'll take the 'best' status (read > delivered > sent)
                         // But simplify: if ANYONE read it, it's read?
                         // @ts-ignore
                         const s = (statusData as any[])?.find((s:any) => s.message_id === m.id);
                         return s ? { ...m, status: s.status } : m;
                     }));
                 }
             }
        };

        loadMessages();
        
        // Subscription for THIS chat
        const channel = supabase.channel(`conv:${selectedConvId}`)
            .on('postgres_changes', { 
                event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}`
            }, async (payload) => {
                const newMsg = payload.new as any;
                
                // Add to list
                setMessages(prev => {
                    if (prev.find(p => p.id === newMsg.id)) return prev;
                    return [...prev, { ...newMsg, is_me: newMsg.sender_id === sessionUserId }];
                });

                // If NOT me, mark as read immediately since I'm looking at it
                if (newMsg.sender_id !== sessionUserId) {
                    // @ts-ignore
                    await supabase.from('message_status')
                        // @ts-ignore
                        .update({ status: 'read', updated_at: new Date().toISOString() })
                        .eq('message_id', newMsg.id)
                        .eq('user_id', sessionUserId);
                }
            })
            // Listen for status updates (ticks)
             .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'message_status'
            }, (payload) => {
                 console.log("Status update received:", payload);
                 setMessages(prev => prev.map(m => {
                     if (m.id === payload.new.message_id) {
                         return { ...m, status: payload.new.status };
                     }
                     return m;
                 }));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };

    }, [selectedConvId, sessionUserId, supabase]);

    // 4. Global Listener (Notifications + Sidebar Updates)
    useEffect(() => {
        if (!sessionUserId) return;

        const globalChannel = supabase.channel(`global-messages:${sessionUserId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages'
            }, async (payload) => {
                const newMsg = payload.new as any;
                const isCurrentChat = newMsg.conversation_id === selectedConvId;
                
                // Always refresh conversations to update Last Message / Unread Count
                // We could do this optimistically but re-fetching is safer for sync
                await fetchConversations();

                // If NOT current chat users sent this, notify
                if (!isCurrentChat && newMsg.sender_id !== sessionUserId) {
                    // Get sender name
                    // @ts-ignore
                    const { data: sender } = await supabase.from('profiles').select('username').eq('id', newMsg.sender_id).single();
                    // @ts-ignore
                    const name = (sender as any)?.username || 'Someone';
                    
                    setNotification({
                        sender: name,
                        text: newMsg.content || (newMsg.message_type === 'image' ? 'Sent an image' : 'Sent a file')
                    });
                    
                    // Auto dismiss
                    setTimeout(() => setNotification(null), 5000);
                }
            })
            .subscribe();
            
        return () => { supabase.removeChannel(globalChannel); };
    }, [sessionUserId, supabase, fetchConversations, selectedConvId]);

    // Scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-create chat from URL
    useEffect(() => {
        if (!sessionUserId || !initialUserId || loadingConvs) return;
        const existing = conversations.find(c => c.type === 'direct' && c.other_user?.id === initialUserId);
        if (existing) {
            setSelectedConvId(existing.id);
            setIsSidebarOpen(false);
        } else {
            // Create
            (async () => {
               try {
                   const { data: { session } } = await supabase.auth.getSession();
                   const token = session?.access_token;
                   if(!token) return;
                   const res = await fetch('/api/create-chat', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                       body: JSON.stringify({ otherId: initialUserId })
                   });
                   const json = await res.json();
                   if (json.chat) {
                       await fetchConversations();
                       setSelectedConvId(json.chat.id);
                       setIsSidebarOpen(false);
                   }
               } catch(e) { console.error(e); }
            })();
        }
    }, [initialUserId, sessionUserId, loadingConvs]); // removed conversations dep to avoid loop, handled by check


    const handleSendMessage = async (val: string) => {
        if (!selectedConvId || !sessionUserId || !val.trim()) return;
        setInput(""); // Optimistic clear
        
        // @ts-ignore
        const { error } = await supabase.from('messages').insert({
            conversation_id: selectedConvId,
            sender_id: sessionUserId,
            content: val.trim(),
            message_type: 'text'
        });
        if (error) console.error("Send failed", error);
    };

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Global Search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const delay = setTimeout(async () => {
             setIsSearching(true);
             // @ts-ignore
             const { data } = await supabase
                .from('profiles')
                .select('id, username, name')
                .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
                .neq('id', sessionUserId)
                .limit(20);
             
             if (data) setSearchResults(data);
             setIsSearching(false);
        }, 300);
        return () => clearTimeout(delay);
    }, [searchQuery, sessionUserId, supabase]);

    // Group Creation State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedMembers.length === 0) return;
        setIsSubmittingGroup(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if(!token) return;

            const res = await fetch('/api/create-group-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    name: newGroupName,
                    memberIds: selectedMembers 
                })
            });
            
            const json = await res.json();
            if (res.ok && json.chat) {
                await fetchConversations();
                setSelectedConvId(json.chat.id);
                // Reset UI
                setIsCreatingGroup(false);
                setNewGroupName("");
                setSelectedMembers([]);
                setSearchQuery("");
                setSearchResults([]);
                setIsSidebarOpen(false);
            } else {
                console.error("Group creation failed", json);
            }
        } catch (e) {
            console.error("Group creation error", e);
        } finally {
            setIsSubmittingGroup(false);
        }
    };

    const toggleMemberSelection = (userId: string) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleStartChat = async (otherId: string) => {
        // Check if existing
        const existing = conversations.find(c => c.other_user?.id === otherId);
        if (existing) {
            setSelectedConvId(existing.id);
            setSearchQuery(""); // Clear search
            setSearchResults([]);
            return;
        }

        // Create new
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if(!token) return;
            const res = await fetch('/api/create-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ otherId })
            });
            const json = await res.json();
            if (json.chat) {
                await fetchConversations();
                setSelectedConvId(json.chat.id);
                setSearchQuery("");
                setSearchResults([]);
            }
        } catch(e) { console.error(e); }

    };

    const handleGroupAction = async (action: 'leave' | 'remove' | 'promote', targetUserId?: string) => {
        if (!selectedConvId) return;
        const confirmMsg = action === 'leave' ? "Are you sure you want to leave this group?" : 
                          action === 'remove' ? "Remove this user from the group?" :
                          "Make this user an admin?";
        
        if (!confirm(confirmMsg)) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

             const res = await fetch('/api/chat/manage-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    action,
                    conversationId: selectedConvId,
                    targetUserId
                })
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Action failed');

            if (action === 'leave') {
                setSelectedConvId(null);
                setIsGroupInfoOpen(false);
                await fetchConversations();
            } else {
                // Refresh to show updated list
                await fetchConversations();
            }
        } catch (e) {
            console.error(e);
            alert("Failed to perform action");
        }
    };

    const activeConv = conversationsWithPresence.find(c => c.id === selectedConvId);

    // Filter conversations for sidebar
    const displayedConvs = conversationsWithPresence.filter(c => 
        c.other_user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.other_user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative flex h-[calc(100dvh-12rem)] md:h-[calc(100dvh-9rem)] w-full mx-auto overflow-hidden rounded-[32px] border border-neutral-200/60 bg-white/80 backdrop-blur-2xl shadow-2xl dark:border-neutral-800/60 dark:bg-neutral-900/80 ring-1 ring-white/50 dark:ring-white/5">
            <ChatBackground />
            
            {/* Notification Toast */}
            {notification && (
                <div 
                    onClick={() => setNotification(null)}
                    className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] cursor-pointer w-full max-w-sm px-4"
                >
                    <div className="bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-top-4 fade-in duration-300 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 text-white shadow-lg shadow-blue-500/20">
                             <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                {notification.sender}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5 font-medium">
                                {notification.text}
                            </p>
                        </div>
                        <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`
                absolute inset-y-0 left-0 z-40 w-full md:w-[380px] md:relative bg-white/50 dark:bg-black/20 backdrop-blur-xl border-r border-neutral-200/50 dark:border-neutral-800/50 
                flex flex-col transform transition-transform duration-300 ease-out lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {isCreatingGroup ? (
                    // GROUP CREATION UI
                    <div className="flex flex-col h-full animate-in slide-in-from-left-4 fade-in duration-300 bg-white/50 dark:bg-black/20">
                        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center gap-4">
                            <button onClick={() => setIsCreatingGroup(false)} className="p-2 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors">
                                <ArrowLeft className="w-5 h-5 text-neutral-900 dark:text-white" />
                            </button>
                            <h2 className="font-bold text-xl text-neutral-900 dark:text-white tracking-tight">New Group</h2>
                        </div>
                        
                        <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Group Name Input */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Group Details</label>
                                <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Group Name" 
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="flex-1 bg-transparent text-lg font-semibold placeholder:text-neutral-400 border-none focus:ring-0 p-0 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Add Members Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Members</label>
                                    <span className="text-xs font-medium px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">{selectedMembers.length} selected</span>
                                </div>
                                
                                {/* Search for members */}
                                <div className="relative group">
                                     <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Users className="w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search people..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 shadow-sm"
                                    />
                                </div>

                                {/* Results List */}
                                <div className="min-h-[200px]">
                                    {searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            {searchResults.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => toggleMemberSelection(user.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${selectedMembers.includes(user.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-neutral-900 border-transparent hover:border-neutral-200 dark:hover:border-neutral-800'}`}
                                                >
                                                    <div className="relative w-10 h-10">
                                                         <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="w-full h-full object-cover" />
                                                         </div>
                                                         {selectedMembers.includes(user.id) && (
                                                             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center animate-in zoom-in duration-200">
                                                                 <Check className="w-3 h-3 text-white" />
                                                             </div>
                                                         )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">{user.username}</h4>
                                                        {user.name && <p className="text-xs text-neutral-500">{user.name}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchQuery ? (
                                        <div className="text-center py-12 text-neutral-400 text-sm">No results found</div>
                                    ) : (
                                        <div className="text-center py-12 text-neutral-400 text-sm">Search to add members</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 border-t border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                            <button 
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim() || selectedMembers.length === 0 || isSubmittingGroup}
                                className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-neutral-500/10"
                            >
                                {isSubmittingGroup ? "Creating..." : (
                                    <>
                                        <Check className="w-5 h-5" /> Create Group
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    // STANDARD SIDEBAR UI
                    <>
                        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/50 space-y-5 bg-white/30 dark:bg-black/10">
                            <div className="flex items-center justify-between">
                                <h1 className="font-bold text-2xl tracking-tighter text-neutral-900 dark:text-white">Messages</h1>
                                <div className="flex gap-2">
                                     {/* New Group Button */}
                                     <button 
                                        onClick={() => setIsCreatingGroup(true)}
                                        className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm border border-neutral-200/50 dark:border-neutral-800 transition-all text-neutral-600 dark:text-neutral-400"
                                        title="Create Group"
                                     >
                                        <UserPlus className="w-5 h-5" />
                                     </button>

                                     {/* Mobile Close */}
                                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <X className="w-5 h-5 dark:text-white" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Users className="w-4 h-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search messages..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 shadow-sm"
                                />
                            </div>
                        </div>
                        
                        {/* Lists */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {searchQuery ? (
                                <div className="space-y-6">
                                     {/* Local Matches */}
                                     {displayedConvs.length > 0 && (
                                         <div>
                                             <h3 className="px-4 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 mt-2">Conversations</h3>
                                             <ConversationList 
                                                conversations={displayedConvs}
                                                selectedId={selectedConvId}
                                                onSelect={(id) => { setSelectedConvId(id); setIsSidebarOpen(false); }}
                                             />
                                         </div>
                                     )}

                                     {/* Global Results */}
                                     <div>
                                         <h3 className="px-4 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Global Search</h3>
                                         {isSearching ? (
                                             <div className="px-4 py-2 text-sm text-neutral-500 flex items-center gap-2">
                                                 <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                 Searching...
                                             </div>
                                         ) : searchResults.length > 0 ? (
                                             <div className="space-y-2">
                                                 {searchResults.map(user => (
                                                     <div 
                                                        key={user.id} 
                                                        onClick={() => handleStartChat(user.id)}
                                                        className="flex items-center gap-3 p-3 mx-1 rounded-2xl hover:bg-white dark:hover:bg-neutral-900 cursor-pointer transition-all border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 hover:shadow-sm group"
                                                     >
                                                         <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden group-hover:scale-105 transition-transform">
                                                             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="w-full h-full object-cover" />
                                                         </div>
                                                         <div>
                                                             <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">{user.username}</h4>
                                                             {user.name && <p className="text-xs text-neutral-500">{user.name}</p>}
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         ) : (
                                             <div className="px-4 py-8 text-center text-sm text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 mx-2">
                                                 No new people found
                                             </div>
                                         )}
                                     </div>
                                </div>
                            ) : (
                                <ConversationList 
                                    conversations={conversationsWithPresence}
                                    selectedId={selectedConvId}
                                    isLoading={loadingConvs}
                                    onSelect={(id) => {
                                        setSelectedConvId(id);
                                        setIsSidebarOpen(false);
                                        setNotification(null);
                                    }}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative w-full h-full bg-neutral-50/50 dark:bg-neutral-900/20">
                <div className="md:hidden absolute top-4 left-4 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-white">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {activeConv ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-20 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center px-6 bg-white/60 dark:bg-black/60 backdrop-blur-xl z-20 justify-between">
                             <div 
                                className={`ml-12 md:ml-0 flex items-center gap-4 ${activeConv.type === 'group' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                onClick={() => activeConv.type === 'group' && setIsGroupInfoOpen(true)}
                             >
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-neutral-500 overflow-hidden ring-2 ring-white dark:ring-neutral-800 shadow-sm">
                                         {activeConv.type === 'group' ? <Users className="w-5 h-5" /> : (
                                            <img 
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConv.other_user?.username}`} 
                                                alt="Avatar" 
                                                className="w-full h-full object-cover" 
                                            />
                                         )}
                                    </div>
                                    {activeConv.type === 'direct' && activeConv.other_user?.is_online && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-sm" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight flex items-center gap-2">
                                        {activeConv.type === 'group' ? activeConv.title : activeConv.other_user?.name || activeConv.other_user?.username}
                                        {activeConv.type === 'group' && <Info className="w-4 h-4 text-neutral-400" />}
                                    </h2>
                                    {activeConv.type === 'direct' ? (
                                        activeConv.other_user?.is_online ? 
                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">Online now</span> : 
                                            <span className="text-xs text-neutral-500">Offline</span>
                                    ) : (
                                        <span className="text-xs text-neutral-500">{activeConv.participants?.length || 0} members</span>
                                    )}
                                </div>
                             </div>

                             {/* Header Actions */}
                             {activeConv.type === 'group' && (
                                (() => {
                                    // @ts-ignore
                                    const isAdmin = activeConv.participants?.find((p: any) => p.user_id === sessionUserId)?.role === 'admin';
                                    if (isAdmin) return null; // Admins cannot leave (per user request)
                                    
                                    return (
                                        <button 
                                            onClick={() => handleGroupAction('leave')}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                            title="Leave Group"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="hidden md:inline">Leave</span>
                                        </button>
                                    );
                                })()
                             )}
                        </div>

                        {/* Group Info Modal */}
                        {isGroupInfoOpen && activeConv.type === 'group' && (
                            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[80vh]">
                                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                                        <h3 className="font-bold text-lg">Group Info</h3>
                                        <button onClick={() => setIsGroupInfoOpen(false)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6 flex flex-col items-center border-b border-neutral-200 dark:border-neutral-800">
                                        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                                            <Users className="w-8 h-8 text-neutral-400" />
                                        </div>
                                        <h2 className="text-xl font-bold">{activeConv.title}</h2>
                                        <p className="text-neutral-500 text-sm">{activeConv.participants?.length} members</p>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2">
                                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-4 py-2">Members</h4>
                                        <div className="space-y-1">
                                            {/* @ts-ignore */}
                                            {activeConv.participants?.map((p: any) => {
                                                const isMe = p.user_id === sessionUserId;
                                                // @ts-ignore
                                                const isAdmin = activeConv.participants?.find((myP: any) => myP.user_id === sessionUserId)?.role === 'admin';
                                                
                                                return (
                                                    <div key={p.user_id} className="flex items-center justify-between p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl group/member">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.username}`} alt={p.user.username} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm">{p.user.username}</span>
                                                                    {p.role === 'admin' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200 flex items-center gap-1"><Crown className="w-3 h-3" /> ADMIN</span>}
                                                                    {isMe && <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-bold border border-neutral-200">YOU</span>}
                                                                </div>
                                                                {p.user.name && <p className="text-xs text-neutral-500">{p.user.name}</p>}
                                                            </div>
                                                        </div>
                                                        
                                                        {isAdmin && !isMe && (
                                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/member:opacity-100 transition-opacity">
                                                                {p.role !== 'admin' && (
                                                                    <button 
                                                                        onClick={() => handleGroupAction('promote', p.user_id)}
                                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                                                        title="Make Admin"
                                                                    >
                                                                        <Shield className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleGroupAction('remove', p.user_id)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                                                    title="Remove User"
                                                                >
                                                                    <LogOut className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
                            {messages.map((m, i) => {
                                // Try to find sender details in participants list
                                // @ts-ignore
                                const senderParticipant = activeConv.participants?.find((p: any) => p.user_id === m.sender_id);
                                // @ts-ignore
                                const senderName = senderParticipant?.user?.username || m.sender?.username || "Unknown";
                                
                                return (
                                    <MessageBubble 
                                        key={m.id} 
                                        message={m} 
                                        isMe={m.is_me || false} 
                                        senderName={senderName}
                                        showName={activeConv.type === 'group'} 
                                    />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 md:p-6 bg-white/60 dark:bg-black/60 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-800/50">
                            <ChatInput 
                                value={input} 
                                onChange={setInput} 
                                onSend={() => handleSendMessage(input)} 
                                disabled={false} 
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                             <Users className="w-10 h-10 text-blue-500/50" />
                        </div>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">Welcome to TeamUp Chat</h2>
                        <p className="text-neutral-500 max-w-sm mb-8 leading-relaxed">
                            Connect with your team, share ideas, and collaborate in real-time. Select a conversation to start.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
