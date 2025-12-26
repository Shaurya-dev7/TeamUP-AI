"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">{children}</span>
  );
}

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [mutuals, setMutuals] = useState(0);
  const [suggested, setSuggested] = useState<any[]>([]);
    // Suggest teammates: similar skills/interests, mutuals, same school/workplace
    useEffect(() => {
      if (!profile) return;
      (async () => {
        let query = supabase.from("profiles").select("username,display_name,bio,workplace,education,created_at").neq("id", profile.id);
        // Prioritize: same workplace, education, or new users
        let filters = [];
        if (profile.workplace) filters.push(`workplace.eq.${profile.workplace}`);
        if (profile.education) filters.push(`education.eq.${profile.education}`);
        if (skills.length) filters.push(...skills.map(s => `bio.ilike.%${s}%`));
        let orFilter = filters.length ? filters.join(",") : undefined;
        if (orFilter) query = query.or(orFilter);
        query = query.order("created_at", { ascending: false }).limit(10);
        const { data } = await query;
        setSuggested(data || []);
      })();
    }, [profile, skills, supabase]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.data?.session?.user?.id ?? null;
      setSessionUserId(userId);
      // fetch profile
      const { data: p } = await supabase.from("profiles").select("id,display_name,bio,workplace,education,availability_status").eq("username", username).maybeSingle();
      setProfile(p);
      // skills
      const { data: skillRows } = await supabase.from("profile_skills").select("skills(name)").eq("profile_id", p?.id);
      setSkills((skillRows || []).map((r: any) => r.skills?.name).filter(Boolean));
      // interests
      const { data: interestRows } = await supabase.from("profile_interests").select("interests(name)").eq("profile_id", p?.id);
      setInterests((interestRows || []).map((r: any) => r.interests?.name).filter(Boolean));
      // followers/following
      const { count: followersCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p?.id);
      setFollowers(followersCount || 0);
      const { count: followingCount } = await supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p?.id);
      setFollowing(followingCount || 0);
      // is following
      if (userId && p?.id) {
        const { data: f } = await supabase.from("follows").select("*").eq("follower_id", userId).eq("following_id", p.id).maybeSingle();
        setIsFollowing(!!f);
        // mutuals
        const { data: mutualRows } = await supabase.rpc("get_mutual_connections", { user1: userId, user2: p.id });
        setMutuals(mutualRows?.count || 0);
      }
    })();
  }, [username, supabase]);

  const handleFollow = async () => {
    if (!sessionUserId || !profile?.id) return;
    await supabase.from("follows").insert([{ follower_id: sessionUserId, following_id: profile.id }]);
    setIsFollowing(true);
    setFollowers((f) => f + 1);
  };
  const handleUnfollow = async () => {
    if (!sessionUserId || !profile?.id) return;
    await supabase.from("follows").delete().eq("follower_id", sessionUserId).eq("following_id", profile.id);
    setIsFollowing(false);
    setFollowers((f) => Math.max(0, f - 1));
  };

  if (!profile) return <div className="p-8 text-center">Loading…</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-neutral-950 text-lg font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
              {(profile.display_name || username || "").split(" ").slice(0, 2).map((w: any) => w[0]).join("")}
            </div>
            <div>
              <div className="text-xl font-semibold tracking-tight">{profile.display_name || username}</div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">@{username}</div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.workplace && <Tag>{profile.workplace}</Tag>}
                {profile.education && <Tag>{profile.education}</Tag>}
                {profile.id === sessionUserId ? (
                  <select
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                    value={profile.availability_status || "Available"}
                    onChange={async (e) => {
                      const val = e.target.value;
                      await supabase.from("profiles").update({ availability_status: val }).eq("id", profile.id);
                      setProfile((p: any) => ({ ...p, availability_status: val }));
                    }}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Looking for team">Looking for team</option>
                  </select>
                ) : (
                  <Tag>Available: {profile.availability_status || "Yes"}</Tag>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {sessionUserId && profile.id !== sessionUserId && (
              isFollowing ? (
                <button type="button" className="rounded-2xl bg-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-300" onClick={handleUnfollow}>Unfollow</button>
              ) : (
                <button type="button" className="rounded-2xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-yellow-300" onClick={handleFollow}>Follow</button>
              )
            )}
            <a href="/chat" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">Message</a>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Followers" value={followers + ""} />
          <Stat label="Following" value={following + ""} />
          <Stat label="Mutual connections" value={mutuals + ""} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => <Tag key={s}>{s}</Tag>)}
          </div>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Interests</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((i) => <Tag key={i}>{i}</Tag>)}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-base font-semibold">Suggested teammates</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">AI suggestions: similar skills, interests, or network.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {suggested.length === 0 && <div className="text-sm text-neutral-500">No suggestions yet.</div>}
          {suggested.map((u) => (
            <a key={u.username} href={`/profile/${u.username}`} className="rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">@{u.username}</div>
                <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-neutral-950">Match</span>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{u.workplace || u.education || u.bio}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
