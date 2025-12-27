"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
type Profile = {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};
import { createClient } from "@/lib/supabase/client";

type Chat = {
  id: string;
  title?: string | null;
  is_group: boolean;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const supabase = useMemo(() => createClient(), []);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { display_name?: string | null }>>({});
  const [input, setInput] = useState("");
  const subRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<any>(null);
  // Profile search state
  const [profileQuery, setProfileQuery] = useState("");
  const [profileResults, setProfileResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  // Profile search effect - use the new search API
  useEffect(() => {
    if (!profileQuery.trim()) {
      setProfileResults([]);
      return;
    }
    setSearching(true);
    let cancelled = false;
    
    // Debounce search
    const timeoutId = setTimeout(async () => {
      try {
        // First try exact username match via profile API (faster for exact matches)
        const exactMatch = await fetch(`/api/profile?username=${encodeURIComponent(profileQuery.trim())}`);
        if (exactMatch.ok) {
          const exactBody = await exactMatch.json();
          if (!cancelled && exactBody.profile) {
            setProfileResults([{
              id: exactBody.profile.id,
              username: exactBody.profile.username,
              display_name: exactBody.profile.display_name,
              bio: exactBody.profile.bio,
              avatar_url: exactBody.profile.avatar_url,
            }]);
            setSearching(false);
            return;
          }
        }
        
        // Fallback to search API for partial matches
        const resp = await fetch(`/api/search-profiles?q=${encodeURIComponent(profileQuery.trim())}&limit=20`);
        if (resp.ok) {
          const body = await resp.json();
          if (!cancelled) {
            setProfileResults((body.profiles || []).map((p: any) => ({
              id: p.id,
              username: p.username,
              display_name: p.display_name,
              bio: p.bio,
              avatar_url: p.avatar_url,
            })));
            setSearching(false);
            return;
          }
        }
      } catch (e) {
        console.error("Search failed:", e);
      }

      // Fallback to client-side search if API fails
      if (!cancelled) {
        let query = supabase
          .from("profiles")
          .select("id,username,display_name,bio,avatar_url")
          .order("created_at", { ascending: false })
          .limit(10);
        if (profileQuery.trim()) {
          query = query.or(
            `username.ilike.%${profileQuery.trim()}%,display_name.ilike.%${profileQuery.trim()}%,bio.ilike.%${profileQuery.trim()}%`
          );
        }
        const { data } = await query;
        if (!cancelled) setProfileResults(data || []);
        setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [profileQuery, supabase]);

  // Listen for auth state changes and update sessionUserId
  useEffect(() => {
    let mounted = true;
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;
      if (!mounted) return;
      setSessionUserId(userId);
      if (!userId) return;
      // load chats where user is a member
      const { data: rows, error } = await supabase
        .from("chat_members")
        .select("chat_id, chats(id, title, is_group)")
        .eq("profile_id", userId);
      if (error) {
        console.error("load chats error", error);
      } else if (rows) {
        const mapped: Chat[] = rows.map((r: any) => r.chats || { id: r.chat_id, title: null, is_group: false });
        setChats(mapped);
      }
    };
    fetchSession();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
      if (session?.user?.id) fetchSession();
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!selectedChat) return;

    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, chat_id, sender_id, content, created_at")
        .eq("chat_id", selectedChat.id)
        .order("created_at", { ascending: true });

      if (error) console.error("load messages", error);
      else if (mounted) {
        setMessages(data || []);
        // preload sender display names
        const senderIds = Array.from(new Set((data || []).map((m: any) => m.sender_id)));
        if (senderIds.length) {
          const { data: profiles } = await supabase.from("profiles").select("id,display_name").in("id", senderIds as any[]);
          const map: Record<string, any> = {};
          (profiles || []).forEach((p: any) => (map[p.id] = { display_name: p.display_name }));
          setProfileMap((prev) => ({ ...prev, ...map }));
        }
      }

      // subscribe to new messages
      if (subRef.current) {
        try {
          supabase.removeChannel(subRef.current);
        } catch (e) {}
        subRef.current = null;
      }

      const channel = supabase
        .channel("public:chat_messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          async (payload) => {
            const msg = payload.new as Message;
            if (msg.chat_id === selectedChat.id) {
              // fetch sender profile if unknown
              if (!profileMap[msg.sender_id]) {
                try {
                  const { data: p } = await supabase.from("profiles").select("id,display_name").eq("id", msg.sender_id).maybeSingle();
                  if (p) setProfileMap((m) => ({ ...m, [p.id]: { display_name: p.display_name } }));
                } catch (e) {
                  console.warn("failed to fetch profile for message sender", e);
                }
              }
              setMessages((m) => [...m, msg]);
            }
          }
        )
        .subscribe();

      subRef.current = channel;

      // subscribe to typing indicators (if table exists)
      try {
        const tchannel = supabase
          .channel("public:chat_typing")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "chat_typing" },
            (payload) => {
              const row = payload.new as any;
              if (row.chat_id === selectedChat.id) setTypingUsers((t) => ({ ...t, [row.profile_id]: true }));
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "chat_typing" },
            (payload) => {
              const row = payload.old as any;
              if (row.chat_id === selectedChat.id) setTypingUsers((t) => {
                const c = { ...t };
                delete c[row.profile_id];
                return c;
              });
            }
          )
          .subscribe();

        // keep reference so we can remove later
        // merge into subRef for cleanup
        subRef.current = { ...(subRef.current || {}), typingChannel: tchannel };
      } catch (e) {
        // typing table may not exist; ignore
      }
    })();

    return () => {
      if (subRef.current) {
        try {
          supabase.removeChannel(subRef.current);
        } catch (e) {}
        subRef.current = null;
      }
      mounted = false;
    };
  }, [selectedChat, supabase]);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Send message and trigger notification for recipient
  const handleSend = async () => {
    if (!selectedChat || !sessionUserId || !input.trim()) return;
    const content = input.trim();
    setInput("");
    // Insert message
    const { error } = await supabase.from("chat_messages").insert([
      { chat_id: selectedChat.id, sender_id: sessionUserId, content },
    ]);
    if (error) {
      console.error("send message error", error);
      return;
    }
    // Find recipient (other member in 1:1 chat)
    const { data: members } = await supabase
      .from("chat_members")
      .select("profile_id")
      .eq("chat_id", selectedChat.id);
    if (members && members.length === 2) {
      const recipient = members.find((m: any) => m.profile_id !== sessionUserId);
      if (recipient) {
        // Insert notification for recipient
        await supabase.from("notifications").insert([
          {
            user_id: recipient.profile_id,
            type: "chat_message",
            data: JSON.stringify({ chat_id: selectedChat.id, sender_id: sessionUserId, content }),
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  // New: Start chat with selected profile
  // Robust: Always create/find 1:1 chat and open it
  const handleStartChatWithProfile = async (profile: Profile) => {
    if (!sessionUserId || !profile.id) return;
    // Find existing 1:1 chat between these two users
    let chatId = null;
    const { data: existingChats } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("profile_id", sessionUserId);
    if (existingChats && existingChats.length) {
      for (const row of existingChats) {
        // Check if this chat is a 1:1 chat with the selected user
        const { data: members } = await supabase
          .from("chat_members")
          .select("profile_id")
          .eq("chat_id", row.chat_id);
        if (members && members.length === 2 && members.some((m: any) => m.profile_id === profile.id)) {
          chatId = row.chat_id;
          break;
        }
      }
    }
    if (!chatId) {
      // Create new chat and add both users
      const { data: chatData, error: cErr } = await supabase.from("chats").insert([{ is_group: false }]).select("id").single();
      if (cErr || !chatData) {
        alert("Failed to create chat");
        return;
      }
      chatId = chatData.id;
      await supabase.from("chat_members").insert([
        { chat_id: chatId, profile_id: sessionUserId },
        { chat_id: chatId, profile_id: profile.id },
      ]);
      setChats((c) => [...c, { id: chatId, is_group: false }]);
    }
    // Always select the chat
    setSelectedChat({ id: chatId, is_group: false });
    setProfileQuery("");
    setProfileResults([]);
  };

  // typing indicator: local and attempt to publish to `chat_typing` table
  const publishTyping = async (isTyping: boolean) => {
    if (!selectedChat || !sessionUserId) return;
    try {
      if (isTyping) {
        await supabase.from("chat_typing").upsert([{ chat_id: selectedChat.id, profile_id: sessionUserId }], { onConflict: ["chat_id", "profile_id"] });
      } else {
        await supabase.from("chat_typing").delete().match({ chat_id: selectedChat.id, profile_id: sessionUserId });
      }
    } catch (e) {
      // table may not exist or permission denied — ignore
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // notify typing
    publishTyping(true).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      publishTyping(false).catch(() => {});
    }, 1500);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                1:1 and group chats — real-time powered by Supabase.
              </p>
            </div>
          </div>
          {/* Profile search bar */}
          <div className="mt-4">
            <input
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              placeholder="Search profiles to chat..."
              value={profileQuery}
              onChange={e => setProfileQuery(e.target.value)}
              disabled={!!(!sessionUserId && profileQuery.length > 0)}
            />
            {profileQuery && (
              <div className="mt-2 rounded-2xl border border-neutral-200 bg-white shadow dark:border-neutral-800 dark:bg-neutral-950 max-h-60 overflow-y-auto">
                {searching && <div className="p-3 text-sm text-neutral-500">Searching...</div>}
                {!searching && profileResults.length === 0 && <div className="p-3 text-sm text-neutral-500">No profiles found.</div>}
                {profileResults.map((p) => (
                  <div key={p.id} className="flex w-full items-center gap-3 px-4 py-2 hover:bg-yellow-50 dark:hover:bg-neutral-900">
                    <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => handleStartChatWithProfile(p)}>
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-950 text-xs font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
                        {(p.display_name || p.username).split(" ").slice(0, 2).map((w: any) => w[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.display_name || p.username} <span className="text-neutral-500 dark:text-neutral-400">@{p.username}</span></div>
                        <div className="truncate text-xs text-neutral-600 dark:text-neutral-300">{p.bio}</div>
                      </div>
                    </button>
                    <a href={`/profile/${p.username}`} className="ml-2 rounded-full border px-3 py-1 text-xs font-medium bg-white hover:bg-neutral-50">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Chat list */}
          <div className="mt-4 space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-neutral-200">
            {chats.length > 0 ? chats.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedChat(t)}
                type="button"
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.title || (t.is_group ? "Group chat" : "Direct chat")}</div>
                    <div className="truncate text-sm text-neutral-600 dark:text-neutral-300">Last message…</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-yellow-400 dark:bg-white dark:text-neutral-950">
                    {t.is_group ? "Group" : "1:1"}
                  </span>
                </div>
              </button>
            )) : (
              <div className="text-sm text-neutral-500 dark:text-neutral-400">No chats yet. {sessionUserId ? "Search a profile to start!" : "Sign in to start chatting."}</div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div className="flex h-full min-h-[420px] flex-col rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <div>
              <div className="text-sm font-semibold">{selectedChat ? selectedChat.title || "Conversation" : "Select a conversation"}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Messages will appear here.</div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Details
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto" ref={containerRef}>
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 flex-shrink-0 grid place-items-center rounded-full text-sm font-semibold ${m.sender_id === sessionUserId ? "bg-yellow-400 text-neutral-950" : "bg-neutral-950 text-yellow-400 dark:bg-white dark:text-neutral-950"}`}>
                          {((profileMap[m.sender_id]?.display_name || m.sender_id) + "").split(" ").slice(0, 2).map((w:any)=>w[0]).join("")}
                        </div>
                        <div className="text-xs text-neutral-500">{profileMap[m.sender_id]?.display_name || m.sender_id}</div>
                      </div>
                      <div className={`mt-1 text-sm ${m.sender_id === sessionUserId ? "text-right" : "text-left"}`}>{m.content}</div>
                      <div className="mt-1 text-xs text-neutral-400">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
              {!messages.length && (
                <div className="grid h-40 place-items-center rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                  No messages yet — select a chat or create one.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <input
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                placeholder="Write a message…"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={!!(!selectedChat || !sessionUserId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedChat && sessionUserId) handleSend();
                }}
              />
              <button
                onClick={handleSend}
                type="button"
                className={`rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-neutral-950 ${!selectedChat || !sessionUserId ? "opacity-60" : ""}`}
                disabled={!!(!selectedChat || !sessionUserId)}
              >
                Send
              </button>
                  {/* Show login message if not authenticated */}
                  {!sessionUserId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="rounded-2xl bg-white p-8 shadow-xl text-center">
                        <h2 className="text-xl font-bold mb-2">Sign in required</h2>
                        <p className="text-neutral-700 mb-4">You must be logged in to use chat and search. Please sign in from the profile menu.</p>
                        <a href="/login" className="inline-block rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-neutral-950 shadow hover:bg-yellow-300">Go to Login</a>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
