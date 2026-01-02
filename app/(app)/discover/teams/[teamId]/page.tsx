"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Users, Lock, Unlock, MessageCircle, Settings, Loader2, 
  UserPlus, LogOut, Crown, Shield, ChevronLeft, Copy,
  Check, ExternalLink, MoreHorizontal, Trash2, X
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface TeamMember {
  id: string;
  user_id: string;
  role: 'leader' | 'co_leader' | 'member';
  joined_at: string;
  username: string;
  name: string | null;
}

interface Team {
  id: number;
  name: string;
  description: string | null;
  goal: string | null;
  join_mode: 'open' | 'request' | 'closed';
  max_members: number;
  member_count: number;
  conversation_id: string | null;
  created_at: string;
  roles_needed: { id: string; name: string }[];
  members?: TeamMember[];
  leader: { id: string; username: string; name: string | null } | null;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const teamId = params?.teamId as string;
  const teamIdNum = parseInt(teamId);

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  // Pending invite/request state
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        setUserId(session?.user?.id || null);

        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/teams/${teamId}`, { headers });
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Team not found");
            router.push("/discover/teams");
            return;
          }
          throw new Error("Failed to fetch team");
        }

        const data = await response.json();
        setTeam(data.team);
        setIsMember(data.is_member);
        setUserRole(data.user_role);

        // Check for pending invite (if not a member)
        if (!data.is_member && session?.user?.id) {
          const { data: inviteData } = await supabase
            .from("team_invitations")
            .select("id")
            .eq("team_id", teamIdNum)
            .eq("invited_user_id", session.user.id)
            .eq("status", "pending")
            .maybeSingle();
          
          setPendingInvite((inviteData as any)?.id || null);

          // Check for pending request
          const { data: requestData } = await supabase
            .from("team_join_requests")
            .select("id")
            .eq("team_id", teamIdNum)
            .eq("user_id", session.user.id)
            .eq("status", "pending")
            .maybeSingle();
          
          setPendingRequest((requestData as any)?.id || null);
        }
      } catch (error) {
        console.error("Team fetch error:", error);
        toast.error("Failed to load team");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time subscription for team member changes
    const channel = supabase
      .channel(`team-members-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_members", filter: `team_id=eq.${teamIdNum}` },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, supabase]);

  const copyTeamId = () => {
    navigator.clipboard.writeText(teamId);
    setCopied(true);
    toast.success("Team ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteResponse = async (action: "accept" | "decline") => {
    if (!pendingInvite || !userId) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/invites/${pendingInvite}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Action failed");
      }

      if (action === "accept") {
        toast.success("Joined team successfully!");
        window.location.reload(); // Refresh to show member view
      } else {
        toast.success("Invite declined");
        setPendingInvite(null);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!userId) {
      toast.error("Please log in to apply");
      return;
    }

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/teams/${teamId}/join-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ message: joinMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      if (data.joined) {
        toast.success("Joined team successfully!");
        window.location.reload(); // Refresh to show member view
        return;
      }

      toast.success("Join request submitted!");
      setJoinMessage("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/teams/${teamId}/members?user_id=${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave team");
      }

      toast.success("Left team successfully");
      router.push("/discover/teams");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete team");
      }

      toast.success("Team deleted");
      router.push("/discover/teams");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const isLeaderOrCoLeader = userRole === "leader" || userRole === "co_leader";
  const isLeader = userRole === "leader";
  const isFull = team && team.member_count >= team.max_members;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-10">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="mb-8 h-12 w-2/3" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-neutral-500">Team not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      {/* Back Button */}
      <Link
        href="/discover/teams"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Teams
      </Link>

      {/* Header */}
      <div className="mb-8">
        {/* Team ID Badge */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={copyTeamId}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
          >
            Team #{team.id}
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
              team.join_mode === 'open'
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : team.join_mode === 'request'
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {team.join_mode === 'closed' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {team.join_mode === 'open' ? 'Open' : team.join_mode === 'request' ? 'Apply' : 'Closed'}
          </span>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
          {team.name}
        </h1>

        {team.leader && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-neutral-500">Led by</span>
            <Link 
              href={`/profile/${team.leader.username}`}
              className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 transition-colors"
            >
              <Crown className="h-3.5 w-3.5 text-yellow-500" />
              {team.leader.name || team.leader.username}
            </Link>
          </div>
        )}

        {team.goal && (
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {team.goal}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {team.description && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-400">
                About
              </h2>
              <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                {team.description}
              </p>
            </div>
          )}

          {/* Roles Needed */}
          {team.roles_needed.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-400">
                Looking For
              </h2>
              <div className="flex flex-wrap gap-2">
                {team.roles_needed.map((role) => (
                  <span
                    key={role.id}
                    className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Members (for team members only) */}
          {isMember && team.members && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
                Team Members ({team.member_count}/{team.max_members})
              </h2>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                          alt={member.username}
                          className="h-9 w-9 rounded-full"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/profile/${member.username}`}
                          className="font-semibold text-neutral-900 hover:underline dark:text-white"
                        >
                          {member.name || member.username}
                        </Link>
                        <p className="text-xs text-neutral-500">@{member.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.role === "leader" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 dark:bg-yellow-900/30">
                          <Crown className="h-3 w-3" /> Leader
                        </span>
                      )}
                      {member.role === "co_leader" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30">
                          <Shield className="h-3 w-3" /> Co-Leader
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-4">
          {/* Member Count */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
                <Users className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {team.member_count} / {team.max_members}
                </p>
                <p className="text-sm text-neutral-500">
                  {isFull ? "Team is full" : "Members"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions for Members */}
          {isMember && (
            <>
              {/* Team Chat */}
              {team.conversation_id && (
                <Link
                  href={`/discover/teams/${team.id}/chat`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 font-bold text-neutral-900 shadow-lg shadow-yellow-400/25 transition-all hover:bg-yellow-500"
                >
                  <MessageCircle className="h-5 w-5" />
                  Team Chat
                </Link>
              )}

              {/* Edit Button (for leaders) */}
              {isLeaderOrCoLeader && (
                <Link
                  href={`/discover/teams/${team.id}/edit`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <Settings className="h-4 w-4" />
                  Edit Team
                </Link>
              )}

              {/* Invite Button */}
              {isLeaderOrCoLeader && !isFull && (
                <Link
                  href={`/discover/teams/${team.id}/invite`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Members
                </Link>
              )}

              {/* Leave Team (non-leaders) */}
              {!isLeader && (
                <button
                  onClick={handleLeaveTeam}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Leave Team
                </button>
              )}

              {/* Delete Team (leader only) */}
              {isLeader && (
                <button
                  onClick={handleDeleteTeam}
                  disabled={actionLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete Team
                </button>
              )}
            </>
          )}

          {/* Actions for Non-Members */}
          {!isMember && (
            <>
              {/* Pending Invite - Show Accept/Reject */}
              {pendingInvite && !pendingRequest && (
                <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-5 dark:bg-yellow-900/20 dark:border-yellow-600">
                  <div className="flex items-center gap-2 mb-3">
                    <UserPlus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-bold text-neutral-900 dark:text-white">You're Invited!</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    You have a pending invitation to join this team.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleInviteResponse("accept")}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-yellow-400 py-3 font-bold text-neutral-900 shadow-lg shadow-yellow-400/25 transition-all hover:bg-yellow-500 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {actionLoading ? "Processing..." : "Accept"}
                    </button>
                    <button
                      onClick={() => handleInviteResponse("decline")}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 font-bold text-neutral-600 transition-all hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Request - Show Status */}
              {pendingRequest && !pendingInvite && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:bg-neutral-800/50 dark:border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                    <span className="font-bold text-neutral-900 dark:text-white">Request Pending</span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your join request is awaiting approval from the team leaders.
                  </p>
                </div>
              )}

              {/* Mutual exclusivity guard - should never happen */}
              {pendingInvite && pendingRequest && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                  You have both a pending invite and request. Please contact the team leader.
                </div>
              )}

              {/* Open/Request Team: Apply - only show if no pending invite/request */}
              {!pendingInvite && !pendingRequest && team.join_mode !== 'closed' && !isFull && (
                <div className="space-y-3">
                  <textarea
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    placeholder="Why would you like to join? (optional)"
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <button
                    onClick={handleJoinRequest}
                    disabled={actionLoading || !userId}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold shadow-lg transition-all disabled:opacity-50 ${
                      team.join_mode === 'open'
                        ? 'bg-green-500 text-white shadow-green-500/25 hover:bg-green-600'
                        : 'bg-yellow-400 text-neutral-900 shadow-yellow-400/25 hover:bg-yellow-500'
                    }`}
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    {actionLoading ? "Processing..." : team.join_mode === 'open' ? 'Join Team' : 'Apply to Join'}
                  </button>
                </div>
              )}

              {/* Closed Team: Message Leader */}
              {team.join_mode === 'closed' && team.leader && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-neutral-500">
                    This team is invite-only. Contact the leader to join.
                  </p>
                  <Link
                    href={`/chat?userId=${team.leader.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 font-bold text-white transition-colors hover:bg-black dark:bg-white dark:text-black"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Message @{team.leader.username}
                  </Link>
                </div>
              )}

              {/* Team Full */}
              {isFull && (
                <div className="rounded-xl bg-neutral-100 p-4 text-center dark:bg-neutral-800">
                  <p className="font-medium text-neutral-600 dark:text-neutral-400">
                    This team is currently full.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
