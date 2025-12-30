"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logError } from "@/app/actions";
import { ChatBackground } from "@/components/chat/ChatBackground";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { X, Plus, Search, CheckCheck, Users } from "lucide-react"; // Assuming we can use lucid-react if installed, else fallback to text

type Profile = {
  id: string;
  username: string;
  name?: string | null;
};
type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};
type Chat = {
  id: string;
  created_at: string;
  is_group: boolean;
  title?: string | null;
  other_user?: Profile; // Only for 1:1
};

// Modal for Group Creation
function CreateGroupModal({
  isOpen,
  onClose,
  currentUserId,
  onCreate,
  supabase,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onCreate: (name: string, pids: string[]) => void;
  supabase: any;
}) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Select Members, 2: Name Group
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      // Simple search implementation
      const { data } = await supabase
        .from("profiles")
        .select("id, username, name")
        .ilike("username", `%${query}%`)
        .neq("id", currentUserId)
        .limit(10);
      setResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, currentUserId, supabase]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (selectedIds.size === 0) return;
    setStep(2);
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;
    onCreate(groupName, Array.from(selectedIds));
    onClose();
    // reset
    setStep(1);
    setQuery("");
    setSelectedIds(new Set());
    setGroupName("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h3 className="text-lg font-bold dark:text-white">
            {step === 1 ? "Add Members" : "Name Group"}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
             <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        <div className="p-4">
          {step === 1 ? (
            <>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-yellow-400 dark:border-neutral-800 dark:bg-neutral-800 dark:text-white"
                  placeholder="Search people..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="mb-4 max-h-60 overflow-y-auto space-y-2">
                {results.map((profile) => {
                  const isSelected = selectedIds.has(profile.id);
                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (isSelected) next.delete(profile.id);
                        else next.add(profile.id);
                        setSelectedIds(next);
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${isSelected ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                          {profile.username[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                           <div className="text-sm font-semibold dark:text-white">{profile.username}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCheck className="w-4 h-4 text-yellow-500" />}
                    </div>
                  );
                })}
                {query && results.length === 0 && (
                   <div className="text-center text-sm text-neutral-500 py-4">No users found</div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-neutral-500">{selectedIds.size} selected</div>
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={handleNext}
                    className="rounded-xl bg-yellow-400 px-6 py-2 text-sm font-bold text-neutral-950 disabled:opacity-50 hover:bg-yellow-300"
                  >
                    Next
                  </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
               <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-500">Group Name</label>
                  <input 
                     className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 outline-none focus:border-yellow-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                     placeholder="e.g. Hackathon Team A"
                     value={groupName}
                     onChange={e => setGroupName(e.target.value)}
                     autoFocus
                  />
               </div>
               <button
                    disabled={!groupName.trim()}
                    onClick={handleCreate}
                    className="w-full rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-neutral-950 disabled:opacity-50 hover:bg-yellow-300"
                  >
                    Create Group
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatClient() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const initialUserId = searchParams ? searchParams.get("userId") : null;

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  
  // Sidebar state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Group creation state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (mounted) {
        setSessionUserId(session?.user?.id ?? null);
      }
    };
    fetchSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessionUserId(session?.user?.id ?? null);
      }
    );
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch Chats
  const fetchChats = async () => {
    if (!sessionUserId) return;
    try {
      setLoading(true);
      const { data: myMemberships, error: memError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("profile_id", sessionUserId);
      
      if (memError) throw memError;
      if (!myMemberships || myMemberships.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const myChatIds = myMemberships.map((m: any) => m.chat_id);
      
      const { data: chatsData, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", myChatIds)
        .order('created_at', { ascending: false });
      
      if (chatsError) throw chatsError;

      // Group chats don't need "other_user" lookup in the same way, but DM chats do.
      // We can fetch details for DM chats.
      
      const dmChatIds = chatsData?.filter((c: any) => !c.is_group).map((c: any) => c.id) || [];
      
      let profilesMap = new Map();

      if (dmChatIds.length > 0) {
          const { data: allMembers, error: allMemError } = await supabase
          .from("chat_members")
          .select("chat_id, profile_id")
          .in("chat_id", dmChatIds);

          if (allMemError) throw allMemError;

          const memberProfileIds = Array.from(new Set(allMembers?.map((m: any) => m.profile_id) || []));
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username, name")
            .in("id", memberProfileIds);
            
          if (profilesError) throw profilesError;
          profilesMap = new Map(profilesData?.map((p: any) => [p.id, p]));
      }
      
      // Need membership data again for mapping to specific chats
      const { data: allMembersForMap } = await supabase
            .from("chat_members")
            .select("chat_id, profile_id")
            .in("chat_id", dmChatIds);

      const formattedChats: Chat[] = chatsData?.map((c: any) => {
        if (c.is_group) {
            return {
                id: c.id,
                created_at: c.created_at,
                is_group: true,
                title: c.title,
            };
        } else {
            // Find other user logic
             const chatMembers = allMembersForMap?.filter((m: any) => m.chat_id === c.id) || [];
             const otherMember = chatMembers.find((m: any) => m.profile_id !== sessionUserId) || chatMembers[0];
             const otherProfile = otherMember ? profilesMap.get((otherMember as any).profile_id) : undefined;
             return {
                id: c.id,
                created_at: c.created_at,
                is_group: false,
                other_user: otherProfile || { id: "unknown", username: "Unknown User" },
             };
        }
      }) || [];
      
      setChats(formattedChats);
    } catch (error: any) {
      console.error("Error fetching chats:", error);
      logError("Error fetching chats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    const channel = supabase
      .channel("public:chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => fetchChats()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionUserId, supabase]);

  useEffect(() => {
    if (!sessionUserId || !initialUserId || loading) return;
    const startChat = async () => {
      if (initialUserId === sessionUserId) return;
      if (!initialUserId) return;

      const existingChat = chats.find(
        (c) => !c.is_group && c.other_user?.id === initialUserId
      );

      if (existingChat) {
        setSelectedChatId(existingChat.id);
        setIsSidebarOpen(false);
      } else {
        createChat(initialUserId);
      }
    };
    startChat();
  }, [initialUserId, sessionUserId, chats, loading]);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Realtime subscription for messages
    const channel = supabase
      .channel(`chat:${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${selectedChatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatId, supabase]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create DM
  const createChat = async (otherId: string) => {
    if (!sessionUserId) return;
    try {
      const existing = chats.find(c => !c.is_group && c.other_user?.id === otherId);
      if (existing) {
        setSelectedChatId(existing.id);
        setIsSidebarOpen(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const resp = await fetch('/api/create-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ otherId }),
      });

      if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          alert('Error creating chat: ' + body.error);
          return;
      }

      const { chat } = await resp.json();
      if (chat?.id) {
        setSelectedChatId(chat.id);
        setIsSidebarOpen(false);
        fetchChats(); // manual refetch
      }
    } catch (e) {
      console.error('Create chat error', e);
    }
  };

  // Create Group
  const handleCreateGroup = async (name: string, pids: string[]) => {
      if (!sessionUserId) return;
      try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

        const resp = await fetch('/api/create-group-chat', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name, memberIds: pids }),
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            alert('Error creating group: ' + body.error);
            return;
        }

        const { chat } = await resp.json();
        if (chat?.id) {
            setSelectedChatId(chat.id);
            setIsSidebarOpen(false);
            fetchChats();
        }

      } catch (e) {
          console.error("Group creation fail", e);
      }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChatId || !sessionUserId) return;

    const content = input.trim();
    setInput("");

    const { error } = await supabase.from("chat_messages").insert({
      chat_id: selectedChatId,
      sender_id: sessionUserId,
      content,
    } as any);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Update updated_at
      await supabase
        .from("chats")
        // @ts-ignore
        .update({ updated_at: new Date().toISOString() } as any)
        .eq("id", selectedChatId);
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);

  // Full Chat UI
  return (
    <div className="relative flex h-[calc(100vh-6rem)] w-full overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-black">
      {/* Background Effects */}
      <ChatBackground />

      <CreateGroupModal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
        currentUserId={sessionUserId || ""}
        onCreate={handleCreateGroup}
        supabase={supabase}
      />

      {/* Mobile Toggle */}
      <div className="absolute left-4 top-4 z-50 md:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-white"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <ChatSidebar
        chats={chats as any} // Cast if needed due to extended type
        selectedChatId={selectedChatId}
        onSelectChat={(id) => {
          setSelectedChatId(id);
          setIsSidebarOpen(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateChat={() => setIsGroupModalOpen(true)} // Opens group modal now
        isOpenMobile={isSidebarOpen}
        searchResults={searchResults}
        isSearching={isSearching}
        onSelectResult={(profile) => {
          createChat(profile.id);
          setSearchQuery("");
          setSearchResults([]);
        }}
      />

      {/* Chat Area */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-white/30 backdrop-blur-xl dark:bg-black/20">

        {/* Chat Header */}
        {activeChat && (
          <div className="flex h-16 items-center border-b border-white/20 bg-white/40 px-6 backdrop-blur-md dark:bg-black/40">
            <div className="ml-10 flex items-center gap-3 md:ml-0">
              <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-500 overflow-hidden">
                 {activeChat.is_group ? (
                    <Users className="w-5 h-5 text-neutral-600" />
                 ) : (
                    (activeChat.other_user?.username || 'U').charAt(0).toUpperCase()
                 )}
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white">
                  {activeChat.is_group ? activeChat.title : (activeChat.other_user?.name || activeChat.other_user?.username)}
                </h2>
                {activeChat.is_group ? (
                    <p className="text-xs text-neutral-500">Group Chat</p>
                ) : (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                     <span className="h-2 w-2 rounded-full bg-green-500"></span> Online
                    </p>
                )}
              </div>
            </div>
            <div className="ml-auto flex gap-4 text-neutral-500 dark:text-neutral-400">
               {/* Actions */}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {!selectedChatId ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-white/10 p-6 backdrop-blur-sm">
                <span className="text-4xl">👋</span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Welcome to TeamUp Chat</h3>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">Select a conversation or create a new group.</p>
              <button 
                onClick={() => setIsGroupModalOpen(true)}
                className="mt-6 rounded-full bg-yellow-400 px-6 py-3 font-bold text-neutral-950 hover:bg-yellow-300"
              >
                  Create New Group
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMe={msg.sender_id === sessionUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {selectedChatId && (
          <div className="border-t border-white/10 bg-white/40 p-2 backdrop-blur-md dark:bg-black/40">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={async () => {
                await handleSend();
              }}
              disabled={!sessionUserId}
            />
          </div>
        )}
      </div>

    </div>
  );
}
