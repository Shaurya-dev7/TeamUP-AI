"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";

interface NotificationItem {
  id: string; // generated or valid uuid
  title: string;
  desc: string;
  time: string;
  type: "match" | "follow" | "view" | "message" | "system";
  read: boolean;
  actionLink?: string;
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Mock data for demo purposes if no real data
const mockNotifications: NotificationItem[] = [
  {
    id: "mock-1",
    type: "match",
    title: "New Match Found!",
    desc: "You matched with Sarah Chen based on your Python skills.",
    time: "2m ago",
    read: false,
    actionLink: "/chat",
  },
  {
    id: "mock-2",
    type: "message",
    title: "Alex sent a message",
    desc: "Hey! I saw your profile and thought we should team up...",
    time: "15m ago",
    read: false,
    actionLink: "/chat",
  },
  {
    id: "mock-3",
    type: "system",
    title: "Profile Boost",
    desc: "Your profile is getting attention! 50+ views this week.",
    time: "1h ago",
    read: true,
  },
];

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      let fetchedItems: NotificationItem[] = [];

      if (userId) {
        // Fetch profile_events for this user
        const { data: events } = await supabase
          .from("profile_events")
          .select("*,actor:profiles!actor_id(username),target:profiles!target_profile_id(username)")
          .or(`actor_id.eq.${userId},target_profile_id.eq.${userId}`)
          .order("created_at", { ascending: false })
          .limit(20);

        fetchedItems = (events || []).map((e: any) => {
          if (e.event_type === "follow") {
            return { id: e.id, title: "New follower", desc: `@${e.actor?.username} started following you.`, time: timeAgo(e.created_at), type: "follow", read: false };
          }
          if (e.event_type === "view_profile") {
            return { id: e.id, title: "Profile viewed", desc: `@${e.actor?.username} viewed your profile.`, time: timeAgo(e.created_at), type: "view", read: true };
          }
          if (e.event_type === "match") {
            return { id: e.id, title: "New match suggestion", desc: `@${e.target?.username} is a strong match.`, time: timeAgo(e.created_at), type: "match", read: false };
          }
          return null;
        }).filter(Boolean) as NotificationItem[];
      }

      // Merge mock data if fetched isn't enough to show the UI
      if (fetchedItems.length < 1) {
          setItems(mockNotifications);
      } else {
          setItems(fetchedItems);
      }
      setIsLoading(false);
    })();
  }, [supabase]);

  const filteredNotifications = items.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-20 pt-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white/50 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Notifications
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Stay updated with your team activity.
          </p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={markAllRead}
                className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
                Mark all read
            </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`capitalize rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f
                ? "bg-yellow-400 text-neutral-950 shadow-sm"
                : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
            <div className="p-10 text-center text-neutral-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            No notifications found.
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md ${
                !n.read
                  ? "bg-white border-yellow-400/50 shadow-sm dark:bg-neutral-950 dark:border-yellow-400/30"
                  : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800"
              }`}
            >
                {!n.read && (
                    <div className="absolute right-4 top-4 size-2 rounded-full bg-yellow-400" />
                )}

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900 text-2xl">
                    {/* Icons */}
                    {n.type === 'match' && "🤝"}
                    {n.type === 'message' && "💬"}
                    {n.type === 'system' && "🔔"}
                    {n.type === 'follow' && "👣"}
                    {n.type === 'view' && "👀"}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {n.title}
                    </h3>
                    <span className="text-xs text-neutral-400">{n.time}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {n.desc}
                  </p>
                  
                  {n.actionLink && (
                    <div className="pt-2">
                        <Link href={n.actionLink} className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline">
                            View details →
                        </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
