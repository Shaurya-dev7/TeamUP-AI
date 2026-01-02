"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Search, Check, ChevronLeft, User } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

interface UserResult {
  id: string;
  username: string;
  name: string | null;
  skills: string | null;
}

export default function InviteTeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const teamId = params?.teamId as string;

  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkPermission = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const userId = session?.user?.id;

        if (!token || !userId) {
          toast.error("Please log in");
          router.push("/login");
          return;
        }

        setCurrentUserId(userId);

        const response = await fetch(`/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Team not found");

        const data = await response.json();
        
        if (!data.user_role || !["leader", "co_leader"].includes(data.user_role)) {
          toast.error("You don't have permission to invite members");
          router.push(`/discover/teams/${teamId}`);
          return;
        }

        // Fetch existing members to exclude
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamId);

        const existingMemberIds = new Set<string>();
        existingMemberIds.add(userId); // Exclude self
        
        if (members) {
          members.forEach((m: any) => existingMemberIds.add(m.user_id));
        }

        // Fetch pending invites to disable buttons
        const { data: invites } = await supabase
          .from("team_invites")
          .select("invited_user_id")
          .eq("team_id", teamId)
          .eq("status", "pending");

        const pendingInviteIds = new Set<string>();
        if (invites) {
          invites.forEach((i: any) => pendingInviteIds.add(i.invited_user_id));
        }

        setExcludedIds(existingMemberIds);
        setInvitedUsers(pendingInviteIds);
        setHasPermission(true);
        setTeamName(data.team.name);
      } catch (error) {
        console.error("Permission check error:", error);
        router.push("/discover/teams");
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [teamId]);

  useEffect(() => {
    if (!searchQuery.trim() || !hasPermission) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setSearching(true);
      try {
        let query = supabase
          .from("profiles")
          .select("id, username, name, skills")
          .or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
          
        if (excludedIds.size > 0) {
           query = query.not('id', 'in', `(${Array.from(excludedIds).join(',')})`);
        }
          
        const { data } = await query.limit(10);

        setSearchResults(data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    };

    const timeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, hasPermission, excludedIds]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      toast.success("Invite sent!");
      setInvitedUsers(new Set([...invitedUsers, userId]));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInviting(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-10">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-8 h-10 w-2/3" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6">
      {/* Back Link */}
      <Link
        href={`/discover/teams/${teamId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Team
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
          <UserPlus className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
          Invite Members
        </h1>
        <p className="mt-2 text-neutral-500">
          Search for users to invite to <span className="font-semibold">{teamName}</span>
        </p>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        {/* Results */}
        {searching ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            {searchResults.map((user) => {
              const isInvited = invitedUsers.has(user.id);
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="h-9 w-9 rounded-full"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">
                        {user.name || user.username}
                      </p>
                      <p className="text-sm text-neutral-500">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(user.id)}
                    disabled={isInvited || inviting === user.id}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      isInvited
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-yellow-400 text-neutral-900 hover:bg-yellow-500"
                    } disabled:opacity-50`}
                  >
                    {inviting === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isInvited ? (
                      <>
                        <Check className="h-4 w-4" /> {invitedUsers.has(user.id) ? "Invited" : "Invited"}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" /> Invite
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <User className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-neutral-500">No users found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-neutral-500">Search for users to invite</p>
          </div>
        )}
      </div>
    </div>
  );
}
