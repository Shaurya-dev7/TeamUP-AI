"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Github, Linkedin, Briefcase, School, Globe, Award, Sparkles, Loader2, MoreHorizontal, Shield, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

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
  const params = useParams();
  const username = typeof params?.username === 'string' ? params.username : '';
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [mutuals, setMutuals] = useState(0);
  const [mutualList, setMutualList] = useState<any[]>([]); // New state for mutual avatars
  const [suggested, setSuggested] = useState<any[]>([]);

  // Profile view tracking for ML events
  const viewStartTime = useRef<number>(Date.now());

  // Log profile view event on unmount/visibility change
  useEffect(() => {
    if (!username || !profile?.username) return;

    const logProfileView = async () => {
      const durationMs = Date.now() - viewStartTime.current;
      if (durationMs < 1000) return; // Ignore very short views

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        fetch('/api/log-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            event_type: 'profile_view_event',
            payload: {
              viewed_username: profile.username,
              view_duration_ms: durationMs,
              source: 'profile'
            },
            client_ts: new Date().toISOString()
          })
        }).catch(() => {}); // Fire and forget
      } catch {}
    };

    // Log on visibility change (tab switch, minimize) or page unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logProfileView();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', logProfileView);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', logProfileView);
      logProfileView(); // Also log on component unmount
    };
  }, [profile?.username, username, supabase]);

  // Suggest teammates: similar skills/interests, mutuals, same school/workplace
  useEffect(() => {
    if (!profile) return;
    (async () => {
      let query = supabase.from("profiles").select("username,name,college,location,created_at").neq("id", profile.id);
      // Prioritize: same college, location
      let filters = [];
      if (profile.college) filters.push(`college.eq.${profile.college}`);
      if (profile.location) filters.push(`location.eq.${profile.location}`);
      // skills is comma separated string in schema
      if (skills.length) filters.push(...skills.map(s => `skills.ilike.%${s}%`));
      
      let orFilter = filters.length ? filters.join(",") : undefined;
      if (orFilter) query = query.or(orFilter);
      query = query.order("created_at", { ascending: false }).limit(10);
      const { data } = await query;
      setSuggested(data || []);
    })();
  }, [profile, skills, supabase]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following' | 'none'>('none');
  const [modalItems, setModalItems] = useState<any[]>([]);

  const openModal = async (type: 'followers' | 'following') => {
    setModalType(type);
    setModalOpen(true);
    // fetch full list
    if (!profile?.id) return;
    if (type === 'followers') {
      const { data: fLinks } = await supabase.from('follows').select('follower_id').eq('following_id', profile.id);
      const ids = (fLinks || []).map((r: any) => r.follower_id).filter(Boolean);
      const { data: rows } = ids.length ? await supabase.from('profiles').select('id,username,name').in('id', ids) : { data: [] };
      setModalItems(rows || []);
    } else {
      const { data: fLinks } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      const ids = (fLinks || []).map((r: any) => r.following_id).filter(Boolean);
      const { data: rows } = ids.length ? await supabase.from('profiles').select('id,username,name').in('id', ids) : { data: [] };
      setModalItems(rows || []);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('none');
    setModalItems([]);
  };

  // Fetch current user's username
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  
  // Track if current user's profile is complete (for disabling actions)
  const [isMyProfileComplete, setIsMyProfileComplete] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;
      if (mounted) setSessionUserId(userId);
      
      if (userId) {
          const { data: me } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          const meProfile = me as any; // Cast to any to avoid 'never' issue if inference fails
          if (mounted && meProfile) {
            setCurrentUsername(meProfile.username);
            // Check profile completeness for current user
            const hasName = meProfile.name && meProfile.name.trim() !== '';
            const hasPfp = meProfile.avatar_url || meProfile.pfp || meProfile.profile_picture;
            const hasSkillsOrInterests = (meProfile.skills && meProfile.skills.trim() !== '') || 
                                          (meProfile.interests && meProfile.interests.trim() !== '');
            const hasCollegeOrWorkplace = (meProfile.college && meProfile.college.trim() !== '') ||
                                           (meProfile.workplace && meProfile.workplace.trim() !== '');
            setIsMyProfileComplete(hasName && hasPfp && hasSkillsOrInterests && hasCollegeOrWorkplace);
          }
      }

      try {
        if (!username) return;

        // Cache Key
        const CACHE_KEY = `profile_cache_${username}`;

        // Try local storage first
        if (mounted) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Check expiry (1 hour)
                    if (Date.now() - parsed.timestamp < 3600000) {
                        setProfile(parsed.data.profile || null);
                        setSkills(parsed.data.profile?.skills ? parsed.data.profile.skills.split(',').map((s: string) => s.trim()) : []);
                        setFollowers(parsed.data.followers_count || 0);
                        setFollowing(parsed.data.following_count || 0);
                    }
                } catch(e) { localStorage.removeItem(CACHE_KEY); }
            }
        }

        // Fetch profile data from API (bypasses RLS and gets correct counts)
        const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);

        if (!res.ok) {
          if (res.status === 404) {
            console.warn("Profile not found");
            if (mounted && !profile) setProfile(null);
            return;
          }
          console.error("Failed to fetch profile", res.statusText);
          return;
        }

        const data = await res.json();

        if (mounted) {
          // Update Cache
          localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              data
          }));

          setProfile(data.profile);
          // skills from comma separated string
          setSkills(data.profile?.skills ? data.profile.skills.split(',').map((s: string) => s.trim()) : []);
          
          setFollowers(data.followers_count || 0);
          setFollowing(data.following_count || 0);

          // is following
          // Wait until currentUsername is set to check following status correctly
           if (userId && data.profile?.id) {
            // We need currentUsername for this check if we use username-based logic.
            // But we can check inside a separate effect or just here if we await the username fetch.
            // Let's rely on a separate effect or just requery when currentUsername is available?
            // Actually, better to just query it here if we fetched 'me' above.
            
             // To ensure we have correct state, let's fetch 'me' username immediately if not set.
             let myUsername = currentUsername;
             if (!myUsername && userId) {
                 const { data: me } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
                 const meProfile = me as any;
                 myUsername = meProfile?.username;
                 if (mounted && myUsername) setCurrentUsername(myUsername);
             }

             if (myUsername && data.profile.username) {
                 const { data: f } = await supabase
                    .from("follows")
                    .select("*")
                    .eq("follower", myUsername)
                    .eq("following", data.profile.username)
                    .maybeSingle();
                 if (mounted) setIsFollowing(!!f);

                 // --- Mutual Followers Logic ---
                 // 1. Get who I follow
                 const { data: myFollowingData } = await supabase
                     .from('follows')
                     .select('following')
                     .eq('follower', myUsername);
                 
                 const myFollowingSet = new Set((myFollowingData || []).map((r: any) => r.following));

                 // 2. Get who follows them
                 const { data: theirFollowersData } = await supabase
                     .from('follows')
                     .select('follower')
                     .eq('following', data.profile.username);
                 
                 const theirFollowersList = (theirFollowersData || []).map((r: any) => r.follower);

                 // 3. Find Intersection
                 const mutualUsernames = theirFollowersList.filter((u: string) => myFollowingSet.has(u));
                 
                 if (mounted) setMutuals(mutualUsernames.length);

                 // 4. Fetch details for first 3 mutuals
                 if (mutualUsernames.length > 0) {
                     const { data: mutualDetails } = await supabase
                         .from('profiles')
                         .select('username, name, profile_picture_url')
                         .in('username', mutualUsernames.slice(0, 3));
                     if (mounted) setMutualList(mutualDetails || []);
                 } else {
                     if (mounted) setMutualList([]);
                 }
             }
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    })();
    return () => { mounted = false; };
  }, [username, supabase]); // Removed currentUsername from dependency to avoid loop, handled inside.

  // Realtime subscription for follower/following count updates
  useEffect(() => {
    if (!profile?.username) return;

    const channel = supabase
      .channel(`follows-${profile.username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following=eq.${profile.username}`,
        },
        (payload) => {
          // Someone followed this profile
          console.log('New follower:', payload);
          setFollowers((f) => f + 1);
          // If the INSERT is from current user, update isFollowing
          if ((payload.new as any)?.follower === currentUsername) {
            setIsFollowing(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'follows',
          filter: `following=eq.${profile.username}`,
        },
        (payload) => {
          // Someone unfollowed this profile
          console.log('Follower removed:', payload);
          setFollowers((f) => Math.max(0, f - 1));
          // If the DELETE is from current user, update isFollowing
          if ((payload.old as any)?.follower === currentUsername) {
            setIsFollowing(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.username, currentUsername, supabase]);

  // Follow loading state
  const [followLoading, setFollowLoading] = useState(false);

  // Block state
  const [hasBlockedThisUser, setHasBlockedThisUser] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  // Fetch block status when profile loads
  useEffect(() => {
    if (!profile?.username || !sessionUserId || !currentUsername) return;
    if (currentUsername === profile.username) return; // Own profile
    
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`/api/blocks?target=${encodeURIComponent(profile.username)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHasBlockedThisUser(data.blocked);
        }
      } catch (e) {
        console.error('Error checking block status:', e);
      }
    })();
  }, [profile?.username, sessionUserId, currentUsername, supabase]);

  const handleBlock = async () => {
    if (blockLoading || !profile?.username) return;
    setBlockLoading(true);
    setShowBlockConfirmModal(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not logged in');

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ blocked_username: profile.username })
      });

      if (res.ok) {
        setHasBlockedThisUser(true);
        setIsFollowing(false); // Auto-unfollow: blocking removes any follow relationship
        toast.success(`Blocked ${profile.name || profile.username}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to block user');
      }
    } catch (e) {
      console.error('Block error:', e);
      toast.error('Failed to block user');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (blockLoading || !profile?.username) return;
    setBlockLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not logged in');

      const res = await fetch('/api/blocks', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ blocked_username: profile.username })
      });

      if (res.ok) {
        setHasBlockedThisUser(false);
        toast.success(`Unblocked ${profile.name || profile.username}`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch (e) {
      console.error('Unblock error:', e);
      toast.error('Failed to unblock user');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    if (!sessionUserId || !currentUsername || !profile?.username) {
      if (!sessionUserId) alert("Please sign in to follow");
      return;
    }
    // Prevent self-follow (extra safety)
    if (currentUsername === profile.username) return;

    setFollowLoading(true);
    // Optimistic update
    setIsFollowing(true);
    setFollowers((f) => f + 1);
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("No token");

        const res = await fetch('/api/follow', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ following_username: profile.username })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to follow");
        }
        
        toast.success(`You are now following ${profile.name || profile.username}`);
    } catch (error: any) {
         console.error("Follow error:", error);
         // Revert on error
         setIsFollowing(false);
         setFollowers((f) => Math.max(0, f - 1));
         toast.error(error.message || "Failed to follow. Please try again.");
    } finally {
        setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (followLoading) return;
    if (!sessionUserId || !currentUsername || !profile?.username) return;
    
    setFollowLoading(true);
    // Optimistic update
    setIsFollowing(false);
    setFollowers((f) => Math.max(0, f - 1));

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("No token");

        const res = await fetch('/api/follow', {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ following_username: profile.username })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to unfollow");
        }
        
        toast.success(`Unfollowed ${profile.name || profile.username}`);
    } catch (error: any) {
         console.error("Unfollow error:", error);
         // Revert
         setIsFollowing(true);
         setFollowers((f) => f + 1);
         toast.error(error.message || "Failed to unfollow.");
    } finally {
        setFollowLoading(false);
    }
  };

  // Skeleton Loading State
  if (!profile) {
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Skeleton className="size-14 rounded-3xl" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <div className="space-y-1 mt-3">
                         <Skeleton className="h-4 w-40" />
                         <Skeleton className="h-4 w-36" />
                    </div>
                </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-16 rounded-2xl" />
            </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Blocked Banner - shown when you have blocked this user */}
      {hasBlockedThisUser && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-2xl flex items-center gap-3">
          <Shield className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">You have blocked this person</span>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {showBlockConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBlockConfirmModal(false)} />
          <div className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Block {profile.name || profile.username}?</h3>
              <button onClick={() => setShowBlockConfirmModal(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              They won't be able to see your profile or message you. They won't be notified that you blocked them.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={blockLoading}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {blockLoading ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="grid size-14 place-items-center rounded-3xl bg-neutral-950 text-lg font-black text-yellow-400 dark:bg-white dark:text-neutral-950 overflow-hidden">
              {profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                (profile.name || username || "").split(" ").slice(0, 2).map((w: any) => w[0]).join("")
              )}
            </div>
            <div>
              {/* Mutual Followers UI */}
              {mutualList.length > 0 && (
                  <div className="mb-2 flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                          {mutualList.map((m, i) => (
                              <div key={m.username} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-neutral-950 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                                  {m.profile_picture_url ? (
                                      <img src={m.profile_picture_url} alt={m.name} className="h-full w-full object-cover" />
                                  ) : (
                                       <div className="h-full w-full flex items-center justify-center text-[8px] font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                                           {(m.name || m.username).substring(0,2)}
                                       </div>
                                  )}
                              </div>
                          ))}
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          Followed by <span className="font-semibold text-neutral-900 dark:text-neutral-200">{mutualList[0]?.name || mutualList[0]?.username}</span>
                          {mutualList.length > 1 && (
                              <>
                                  {mutualList.length === 2 ? " and " : ", "}
                                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">{mutualList[1]?.name || mutualList[1]?.username}</span>
                              </>
                          )}
                          {mutuals > 2 && (
                              <>
                                  {" and "}
                                  <span className="font-semibold text-neutral-900 dark:text-neutral-200">{mutuals - 2} others</span>
                              </>
                          )}
                      </div>
                  </div>
              )}

              <div className="text-xl font-semibold tracking-tight">{profile.name || username}</div>
              <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">@{username}</div>
              
              {/* Last Active & Invite Status */}
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {/* Last Active - Calculated on frontend */}
                  {profile.last_active_at && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-full sm:w-auto">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {(() => {
                            const date = new Date(profile.last_active_at);
                            const now = new Date();
                            const diff = now.getTime() - date.getTime();
                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            
                            if (days > 30) return "Inactive for 30+ days";
                            if (days > 0) return `Active ${days} day${days > 1 ? 's' : ''} ago`;
                            if (hours > 0) return `Active ${hours} hour${hours > 1 ? 's' : ''} ago`;
                            return "Active recently";
                        })()}
                    </div>
                  )}

                  {/* Invite Status Badge */}
                  {profile.team_invite_status && (
                      <div className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                          profile.team_invite_status === 'not_in_team_open' 
                          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                          : profile.team_invite_status === 'in_team_open'
                          ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
                          : 'bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                      }`}>
                          {profile.team_invite_status === 'not_in_team_open' ? 'Open to Invites' :
                           profile.team_invite_status === 'in_team_open' ? 'Open to Invites (In Team)' :
                           'Not looking for team'}
                      </div>
                  )}
              </div>

              <div className="mt-3 flex flex-col gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {profile.workplace && <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {profile.workplace}</div>}
                  {profile.school && <div className="flex items-center gap-2"><School className="w-4 h-4" /> {profile.school}</div>}
                  {profile.college && <div className="flex items-center gap-2">🎓 {profile.college}</div>}
                  {profile.location && <div className="flex items-center gap-2">📍 {profile.location}</div>}
                  
                  <div className="flex gap-3 mt-2">
                    {profile.github_url && (
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    )}
                    {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                    )}
                  </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {profile.hostel_city && <Tag>{profile.hostel_city}</Tag>}
                {profile.id === sessionUserId ? (
                  <select
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
                    // availability_status in schema? Schema says: 'suspended' (Yes/No), 'profile_completed'. No availability.
                    // Assuming we should likely remove or keep hidden if not in schema. User said STRICT ONLY listed columns.
                    // I will comment out availability for now or remove.
                    // Actually I will remove this block to be safe.
                    style={{display: 'none'}}
                  >
                    <option value="Available">Available</option>
                  </select>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Follow/Unfollow button - hidden if you've blocked this user */}
            {sessionUserId && profile.id !== sessionUserId && currentUsername !== profile.username && !hasBlockedThisUser && (
              isFollowing ? (
                <button 
                    type="button" 
                    disabled={followLoading || !isMyProfileComplete}
                    title={!isMyProfileComplete ? 'Complete your profile to start following and chatting with others.' : ''}
                    className="rounded-2xl bg-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={handleUnfollow}
                >
                    {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unfollow'}
                </button>
              ) : (
                <button 
                    type="button" 
                    disabled={followLoading || !isMyProfileComplete}
                    title={!isMyProfileComplete ? 'Complete your profile to start following and chatting with others.' : ''}
                    className="rounded-2xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={handleFollow}
                >
                    {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Follow'}
                </button>
              )
            )}
            {sessionUserId && profile.id === sessionUserId ? (
               <a href="/create-profile" className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
                 Edit Profile
               </a>
            ) : (
              <>
                {/* Message button - hidden if you've blocked this user, disabled if profile incomplete */}
                {!hasBlockedThisUser && (
                  isMyProfileComplete ? (
                    <a href={`/chat?userId=${profile.id}`} className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
                      Message
                    </a>
                  ) : (
                    <button 
                      type="button"
                      disabled
                      title="Complete your profile to start following and chatting with others."
                      className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold opacity-50 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      Message
                    </button>
                  )
                )}
                {/* 3-dots menu for block/unblock */}
                {sessionUserId && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBlockMenu(!showBlockMenu)}
                      className="rounded-2xl border border-neutral-200 bg-white p-2.5 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {showBlockMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowBlockMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
                          {hasBlockedThisUser ? (
                            <button
                              type="button"
                              onClick={() => { handleUnblock(); setShowBlockMenu(false); }}
                              disabled={blockLoading}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50"
                            >
                              <Shield className="w-4 h-4" />
                              {blockLoading ? 'Unblocking...' : 'Unblock User'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setShowBlockConfirmModal(true); setShowBlockMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Shield className="w-4 h-4" />
                              Block User
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => openModal('followers')} className="w-full text-left">
            <Stat label="Followers" value={followers + ""} />
          </button>
          <button type="button" onClick={() => openModal('following')} className="w-full text-left">
            <Stat label="Following" value={following + ""} />
          </button>
          <Stat label="Mutual connections" value={mutuals + ""} />
        </div>
      </div>

      {/* Modal for followers/following */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative max-w-xl w-full bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modalType === 'followers' ? 'Followers' : 'Following'}</h3>
              <button className="text-sm text-neutral-500" onClick={closeModal}>Close</button>
            </div>
            <div className="mt-4 max-h-72 overflow-y-auto">
              {modalItems.length === 0 && <div className="text-sm text-neutral-500">No users to show.</div>}
              {modalItems.map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-950 text-xs font-black text-yellow-400 grid place-items-center">{(u.name || u.username).split(' ').map((w: any) => w[0]).slice(0, 2).join('')}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{u.name || u.username} <span className="text-neutral-500 text-xs">@{u.username}</span></div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <a href={`/profile/${u.username}`} className="rounded-full border px-3 py-1 text-xs">View</a>
                    <a href="/chat" className="rounded-full border px-3 py-1 text-xs">Message</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => <Tag key={s}>{s}</Tag>)}
          </div>
        
        {/* Interests Section */}
        {profile.interests && profile.interests.length > 0 && (
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <h2 className="text-base font-semibold">Interests</h2>
            </div>
            <div className="flex flex-wrap gap-2">
                {typeof profile.interests === 'string' 
                    ? profile.interests.split(',').map((s: string) => <Tag key={s}>{s.trim()}</Tag>) 
                    : Array.isArray(profile.interests) ? profile.interests.map((s: string) => <Tag key={s}>{s}</Tag>) : null
                }
            </div>
            </div>
        )}

        {/* Certificates Section */}
        {profile.certificates && Array.isArray(profile.certificates) && profile.certificates.length > 0 && (
             <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-teal-500" />
                    <h2 className="text-base font-semibold">Certifications</h2>
                </div>
                <div className="space-y-3">
                    {profile.certificates.map((cert: any, idx: number) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                            <div>
                                <div className="font-semibold text-sm">{cert.title}</div>
                                <div className="text-xs text-neutral-500">{cert.issuer} • {cert.year}</div>
                            </div>
                            {cert.url && (
                                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1">
                                    View Credential <Globe className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
             </div>
        )}
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-base font-semibold">Achievements</h2>
          <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
             {profile.achievements || "No achievements listed"}
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-base font-semibold">Suggested teammates</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">AI suggestions: similar skills, college, or location.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {suggested.length === 0 && <div className="text-sm text-neutral-500">No suggestions yet.</div>}
          {suggested.map((u) => (
            <a key={u.username} href={`/profile/${u.username}`} className="rounded-2xl border border-neutral-200 bg-white p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">@{u.username}</div>
                <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-semibold text-neutral-950">Match</span>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{u.college || u.location || "No details"}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
