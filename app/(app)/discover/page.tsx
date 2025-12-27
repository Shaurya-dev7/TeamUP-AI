"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, UserPlus, UserMinus, MessageCircle } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  followers_count?: number;
  following_count?: number;
  match_count?: number;
  matching_interests?: string[];
  matching_interests_count?: number;
  is_following?: boolean;
};

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), []);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use hero as background
  const Hero = require("@/components/ui/shape-landing-hero").HeroGeometric;
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasInterests, setHasInterests] = useState(false);
  const [followingMap, setFollowingMap] = useState<Map<string, boolean>>(new Map());
  const [suggestedForYou, setSuggestedForYou] = useState<Profile[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);

  // Get session user
  useEffect(() => {
    let mounted = true;
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;
      if (!mounted) return;
      setSessionUserId(userId);
      
      if (userId) {
        // Get username
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .maybeSingle();
        if (mounted) setSessionUsername((profile as any)?.username || null);
      }
    };
    fetchSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
      if (session?.user?.id) fetchSession();
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  // Load initial recommendations (interest-based or top profiles)
  useEffect(() => {
    if (!sessionUserId) {
      // If not logged in, show top profiles
      loadTopProfiles();
      return;
    }

    setLoading(true);
    // Check if user has interests
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("profile_id", sessionUserId)
      .limit(1)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          setHasInterests(true);
          loadInterestBasedProfiles();
        } else {
          setHasInterests(false);
          loadTopProfiles();
        }
      });
    
    // Load "Suggested for you" section
    loadSuggestedForYou();
  }, [sessionUserId, supabase]);

  const loadSuggestedForYou = async () => {
    setLoadingSuggested(true);
    try {
      const res = await fetch("/api/suggested-for-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: sessionUserId, limit: 8 }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestedForYou(data.suggestions);
        // Load follow status for suggested profiles
        if (sessionUserId && data.suggestions.length > 0) {
          loadFollowStatus(data.suggestions.map((p: Profile) => p.id));
        }
      }
    } catch (error) {
      console.error("Failed to load suggested profiles:", error);
    } finally {
      setLoadingSuggested(false);
    }
  };

  const loadInterestBasedProfiles = async () => {
    if (!sessionUserId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/discover-by-interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: sessionUserId, limit: 20 }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setProfiles(data.recommendations);
        // Load follow status
        loadFollowStatus(data.recommendations.map((p: Profile) => p.id));
      }
    } catch (error) {
      console.error("Failed to load interest-based profiles:", error);
      loadTopProfiles(); // Fallback to top profiles
    } finally {
      setLoading(false);
    }
  };

  const loadTopProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/top-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: sessionUserId, limit: 20 }),
      });
      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
        // Load follow status
        if (sessionUserId) {
          loadFollowStatus(data.profiles.map((p: Profile) => p.id));
        }
      }
    } catch (error) {
      console.error("Failed to load top profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowStatus = async (profileIds: string[]) => {
    if (!sessionUserId || profileIds.length === 0) return;
    try {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", sessionUserId)
        .in("following_id", profileIds);
      
      const map = new Map<string, boolean>();
      (data || []).forEach((f: any) => {
        map.set(f.following_id, true);
      });
      setFollowingMap(map);
    } catch (error) {
      console.error("Failed to load follow status:", error);
    }
  };

  // Search profiles
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search-profiles?q=${encodeURIComponent(searchQuery.trim())}&limit=20`)
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data.profiles || []);
          if (sessionUserId && data.profiles) {
            loadFollowStatus(data.profiles.map((p: Profile) => p.id));
          }
        })
        .catch((error) => {
          console.error("Search failed:", error);
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sessionUserId]);

  const handleFollow = async (profileId: string) => {
    if (!sessionUserId) {
      alert("Please sign in to follow users");
      return;
    }

    try {
      await (supabase as any).from("follows").insert([{ follower_id: sessionUserId, following_id: profileId }]);
      setFollowingMap((prev) => new Map(prev).set(profileId, true));
      // Update followers count
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, followers_count: (p.followers_count || 0) + 1 } : p))
      );
      setSearchResults((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, followers_count: (p.followers_count || 0) + 1 } : p))
      );
    } catch (error) {
      console.error("Failed to follow:", error);
    }
  };

  const handleUnfollow = async (profileId: string) => {
    if (!sessionUserId) return;

    try {
      await (supabase as any)
        .from("follows")
        .delete()
        .eq("follower_id", sessionUserId)
        .eq("following_id", profileId);
      setFollowingMap((prev) => {
        const newMap = new Map(prev);
        newMap.delete(profileId);
        return newMap;
      });
      // Update followers count
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) - 1) } : p))
      );
      setSearchResults((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, followers_count: Math.max(0, (p.followers_count || 0) - 1) } : p))
      );
    } catch (error) {
      console.error("Failed to unfollow:", error);
    }
  };

  const displayProfiles = searchQuery.trim() ? searchResults : profiles;
  const isSearchMode = searchQuery.trim().length > 0;

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Hero badge="TeamUp" title1="Find your dream teammates" title2="Build projects together" />
      </div>
      <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {isSearchMode
              ? `Search results for "${searchQuery}"`
              : hasInterests
                ? "People with similar interests"
                : "Top profiles"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search profiles by username, name, or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-white pl-10 pr-4 py-3 text-sm text-neutral-900 outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>
      </div>

      {/* Suggested for You Section (Instagram-style) */}
      {!isSearchMode && sessionUserId && suggestedForYou.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Suggested for you</h2>
            <span className="text-xs text-neutral-500">Based on your interests and popular profiles</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedForYou.map((profile) => {
              const isFollowing = followingMap.get(profile.id) || false;
              const initials = (profile.display_name || profile.username)
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();

              return (
                <div
                  key={profile.id}
                  className="flex-shrink-0 w-48 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${profile.username}`} className="shrink-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name || profile.username}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-neutral-950 text-sm font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
                          {initials}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/profile/${profile.username}`} className="block">
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {profile.display_name || profile.username}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{profile.username}</div>
                      </Link>
                      <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                        {profile.followers_count || 0} followers
                        {profile.matching_interests_count && profile.matching_interests_count > 0 && (
                          <span className="ml-1">• {profile.matching_interests_count} shared interests</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {sessionUserId && profile.id !== sessionUserId && (
                    <button
                      onClick={() => isFollowing ? handleUnfollow(profile.id) : handleFollow(profile.id)}
                      className={`mt-3 w-full rounded-xl px-3 py-1.5 text-xs font-semibold ${
                        isFollowing
                          ? "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                          : "bg-yellow-400 text-neutral-950 hover:bg-yellow-300"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !isSearchMode && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-neutral-500">Loading profiles...</div>
        </div>
      )}

      {/* Search Loading */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-neutral-500">Searching...</div>
        </div>
      )}

      {/* Profiles Grid */}
      {!loading && !searching && displayProfiles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayProfiles.map((profile) => {
            const isFollowing = followingMap.get(profile.id) || false;
            const initials = (profile.display_name || profile.username)
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={profile.id}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
              >
                {/* Profile Header */}
                <div className="flex items-start gap-3">
                  <Link href={`/profile/${profile.username}`} className="shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || profile.username}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-950 text-base font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
                        {initials}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/profile/${profile.username}`} className="block">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {profile.display_name || profile.username}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">@{profile.username}</div>
                    </Link>
                    {profile.bio && (
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">{profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                  <div>
                    <span className="font-semibold">{profile.followers_count || 0}</span> followers
                  </div>
                  <div>
                    <span className="font-semibold">{profile.following_count || 0}</span> following
                  </div>
                  {profile.match_count && profile.match_count > 0 && (
                    <div className="ml-auto">
                      <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-neutral-950">
                        {profile.match_count} match{profile.match_count !== 1 ? "es" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Matching Interests */}
                {profile.matching_interests && profile.matching_interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {profile.matching_interests.slice(0, 3).map((interest, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-neutral-700 dark:text-neutral-300"
                      >
                        {interest}
                      </span>
                    ))}
                    {profile.matching_interests.length > 3 && (
                      <span className="text-xs text-neutral-500">+{profile.matching_interests.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {sessionUserId && profile.id !== sessionUserId && (
                    <>
                      {isFollowing ? (
                        <button
                          onClick={() => handleUnfollow(profile.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                        >
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow(profile.id)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-300"
                        >
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </button>
                      )}
                    </>
                  )}
                  <Link
                    href={`/chat`}
                    onClick={async (e) => {
                      if (!sessionUserId) {
                        e.preventDefault();
                        alert("Please sign in to send messages");
                        return;
                      }
                      // The chat page will handle starting a conversation
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !searching && displayProfiles.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="text-sm text-neutral-500">
            {isSearchMode ? "No profiles found. Try a different search." : "No profiles to show."}
          </div>
        </div>
      )}

      {/* Not Signed In Message */}
      {!sessionUserId && (
        <div className="rounded-3xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-center text-sm text-yellow-700 dark:text-yellow-300">
          <Link href="/login" className="font-semibold underline">
            Sign in
          </Link>{" "}
          to see personalized recommendations and follow users.
        </div>
      )}
    </div>
    </div>
  );
}
