
"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Icon({ type }: { type: string }) {
  const base =
    "grid size-10 place-items-center rounded-2xl border text-sm font-black";
  if (type === "match")
    return (
      <div className={`${base} border-yellow-400/40 bg-yellow-400/15 text-yellow-500`}>
        M
      </div>
    );
  if (type === "follow")
    return (
      <div className={`${base} border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100`}>
        F
      </div>
    );
  return (
    <div className={`${base} border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100`}>
      V
    </div>
  );
}

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = (sessionData as any)?.data?.session?.user?.id;
      if (!userId) return;
      // Fetch profile_events for this user
      const { data: events } = await supabase
        .from("profile_events")
        .select("*,actor:actor_id(username),target:target_profile_id(username)")
        .or(`actor_id.eq.${userId},target_profile_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(20);
      const mapped = (events || []).map((e: any) => {
        if (e.event_type === "follow") {
          return { title: "New follower", desc: `@${e.actor?.username} started following you.`, time: timeAgo(e.created_at), type: "follow" };
        }
        if (e.event_type === "view_profile") {
          return { title: "Profile viewed", desc: `@${e.actor?.username} viewed your profile.`, time: timeAgo(e.created_at), type: "view" };
        }
        if (e.event_type === "match") {
          return { title: "New match suggestion", desc: `@${e.target?.username} is a strong match.`, time: timeAgo(e.created_at), type: "match" };
        }
        return null;
      }).filter(Boolean);
      setItems(mapped);
    })();
  }, [supabase]);
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Matches and interactions.</p>
        </div>
        <button type="button" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">Mark all as read</button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <div className="text-sm text-neutral-500">No notifications yet.</div>}
        {items.map((n, i) => (
          <div key={i} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-start gap-4">
              <Icon type={n.type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">{n.time}</div>
                </div>
                <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{n.desc}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="rounded-xl bg-yellow-400 px-3 py-2 text-xs font-semibold text-neutral-950 hover:bg-yellow-300">View</button>
                  <button type="button" className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
