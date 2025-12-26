
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), []);
  const [q, setQ] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let query = supabase
        .from("profiles")
        .select("username,display_name,bio,avatar_url,availability_status,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (q.trim()) {
        query = query.or(
          `username.ilike.%${q.trim()}%,display_name.ilike.%${q.trim()}%,bio.ilike.%${q.trim()}%`
        );
      }
      const { data } = await query;
      if (!cancelled) setProfiles(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [q, supabase]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">Search profiles and explore suggestions.</p>
        </div>
        <div className="w-full sm:max-w-md">
          <label className="sr-only" htmlFor="q">Search</label>
          <input
            id="q"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search skills, interests, schools, workplaces..."
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {profiles.map((p) => {
          const name = p.display_name || p.username;
          const headline = p.bio || "";
          return (
            <a
              key={p.username}
              href={`/profile/${p.username}`}
              className="group rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-neutral-950 text-sm font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
                      {name.split(" ").slice(0, 2).map((w: any) => w[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {name} <span className="text-neutral-500 dark:text-neutral-400">@{p.username}</span>
                      </div>
                      <div className="truncate text-sm text-neutral-600 dark:text-neutral-300">{headline}</div>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-neutral-950">New</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
