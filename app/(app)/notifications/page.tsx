"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Check, X, Users, Bell, UserPlus, MessageCircle, Eye, Sparkles } from "lucide-react";
import { NotificationSkeleton } from "@/components/ui/skeletons";

// Status constants to prevent typos
const STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

interface NotificationAction {
  label: string;
  action: string;
  invite_id?: string;
  request_id?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  is_read: boolean;
  entity_type?: string;
  entity_id?: string;
  actions?: NotificationAction[];
  // Derived display fields
  timeAgo: string;
  actionLink?: string;
}

function getTimeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "team_invite":
      return <Users className="h-6 w-6" />;
    case "join_request":
      return <UserPlus className="h-6 w-6" />;
    case "member_joined":
      return <Sparkles className="h-6 w-6" />;
    case "request_accepted":
      return <Check className="h-6 w-6" />;
    case "follow":
      return <UserPlus className="h-6 w-6" />;
    case "message":
      return <MessageCircle className="h-6 w-6" />;
    case "view":
      return <Eye className="h-6 w-6" />;
    default:
      return <Bell className="h-6 w-6" />;
  }
}

function getActionLink(notification: NotificationItem): string | undefined {
  if (notification.entity_type === "team" && notification.entity_id) {
    return `/discover/teams/${notification.entity_id}`;
  }
  if (notification.entity_type === "team_invitation" && notification.entity_id) {
    return `/notifications`; // Stay on notifications to handle action
  }
  if (notification.entity_type === "team_join_request" && notification.entity_id) {
    return `/notifications`;
  }
  return undefined;
}

export default function NotificationsPage() {
  const supabase = useMemo(() => createClient(), []);
  // Cast to any for tables not in generated types
  const supabaseAny = supabase as any;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUserId = sessionData?.session?.user?.id;
    setUserId(currentUserId || null);

    if (!currentUserId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Fetch from notifications table
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Notifications fetch error:", error);
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Enrich notifications with team_id for invites if possible
    // We need to fetch invalid invites to get team_id
    const inviteIds = notifications
      .filter((n: any) => n.entity_type === 'team_invitation')
      .map((n: any) => n.entity_id);
    
    let inviteMap: Record<string, any> = {};
    
    if (inviteIds.length > 0) {
        const { data: invites } = await supabase
            .from('team_invites')
            .select('id, team_id, status')
            .in('id', inviteIds);
            
        if (invites) {
            invites.forEach((inv: any) => {
                inviteMap[inv.id] = inv;
            });
        }
    }

    // Fetch join request statuses
    const requestIds = notifications
      .filter((n: any) => n.entity_type === 'team_join_request')
      .map((n: any) => n.entity_id);
    
    let requestMap: Record<string, any> = {};

    if (requestIds.length > 0) {
        const { data: requests } = await supabase
            .from('team_join_requests')
            .select('id, team_id, status')
            .in('id', requestIds);

        if (requests) {
            requests.forEach((req: any) => {
                requestMap[req.id] = req;
            });
        }
    }

    const mappedItems: NotificationItem[] = (notifications || []).map((n: any) => {
      let parsedActions: NotificationAction[] = [];
      try {
        if (n.actions) {
          parsedActions = typeof n.actions === 'string' ? JSON.parse(n.actions) : n.actions;
        }
      } catch (e) {
        console.error("Failed to parse actions:", e);
      }
      
      // Inject team_id into entity_id for linking if it's an invite
      let actionLink = getActionLink({ ...n, actions: parsedActions, timeAgo: "" });
      let teamIdForLink = null;
      let inviteStatus = null;
      
      if (n.entity_type === 'team_invitation' && inviteMap[n.entity_id]) {
          teamIdForLink = inviteMap[n.entity_id].team_id;
          inviteStatus = inviteMap[n.entity_id].status;
      }

      if (n.entity_type === 'team_join_request' && requestMap[n.entity_id]) {
          teamIdForLink = requestMap[n.entity_id].team_id; // Requests also have team_id
          inviteStatus = requestMap[n.entity_id].status; // Reuse inviteStatus field for simplicity or add new one. 
          // Let's reuse 'inviteStatus' as a generic 'status' field or add 'requestStatus'
      }
      
      // Let's use a generic 'entityStatus' to be cleaner
      let entityStatus = inviteStatus; 
      if (n.entity_type === 'team_join_request' && requestMap[n.entity_id]) {
         entityStatus = requestMap[n.entity_id].status;
      }

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        type: n.type,
        is_read: n.is_read,
        entity_type: n.entity_type,
        entity_id: n.entity_id,
        actions: parsedActions,
        timeAgo: getTimeAgo(n.created_at),
        actionLink,
        teamId: teamIdForLink,
        inviteStatus: entityStatus, // Use the generic status here
      };
    });

    setItems(mappedItems);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchNotifications]);

  const handleAction = async (notification: NotificationItem, action: NotificationAction) => {
    setProcessingAction(notification.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error("Please log in");
        return;
      }

      let endpoint = "";
      let actionType: "accept" | "decline" = "accept";

      if (action.action === "ACCEPT_INVITE" && action.invite_id) {
        endpoint = `/api/invites/${action.invite_id}/respond`;
        actionType = "accept";
      } else if (action.action === "REJECT_INVITE" && action.invite_id) {
        endpoint = `/api/invites/${action.invite_id}/respond`;
        actionType = "decline";
      } else if (action.action === "ACCEPT_REQUEST" && action.request_id) {
        endpoint = `/api/join-requests/${action.request_id}/respond`;
        actionType = "accept";
      } else if (action.action === "REJECT_REQUEST" && action.request_id) {
        endpoint = `/api/join-requests/${action.request_id}/respond`;
        actionType = "decline";
      } else {
        toast.error("Unknown action");
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");

      // Mark notification as read
      await supabaseAny
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id);

      // Update local state optimistically
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true, actions: [] }
            : item
        )
      );

      const successMsg = action.action.includes("ACCEPT") 
        ? (action.invite_id ? "Joined team!" : "Member added!")
        : (action.invite_id ? "Invite declined" : "Request declined");

      toast.success(successMsg);
      
      // Refetch to get updated state
      setTimeout(() => fetchNotifications(), 500);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingAction(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabaseAny
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    setItems((prev) =>
      prev.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item
      )
    );
  };

  const markAllRead = async () => {
    if (!userId) return;
    
    await supabaseAny
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const filteredNotifications = items.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  const hasActionableItems = (notification: NotificationItem) => {
    return notification.actions && notification.actions.length > 0;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24 pt-10 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white/50 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/50 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Notifications
          </h1>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            Manage your team invites and updates
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="self-start sm:self-center rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`capitalize rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              filter === f
                ? "bg-neutral-900 text-white shadow-lg dark:bg-white dark:text-neutral-900"
                : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <Bell className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-medium">No notifications yet</p>
            <p className="text-sm text-neutral-400 mt-1">
              You'll see team invites and updates here
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => !hasActionableItems(n) && markAsRead(n.id)}
            >
              <div
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:shadow-md ${
                  !n.is_read
                    ? "bg-white border-yellow-400 shadow-sm dark:bg-neutral-950 dark:border-yellow-600"
                    : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800"
                }`}
              >
                {!n.is_read && (
                  <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-yellow-500 ring-4 ring-white dark:ring-neutral-950" />
                )}

                <div className="flex gap-4">
                  {/* Icon Column */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                    hasActionableItems(n)
                      ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : n.type === "member_joined" || n.type === "request_accepted"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-900"
                  }`}>
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-neutral-900 dark:text-white truncate pr-6">
                        {n.title}
                      </h3>
                      <span className="text-xs font-medium text-neutral-400 whitespace-nowrap">
                        {n.timeAgo}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 break-words leading-relaxed">
                      {(n as any).teamId && n.entity_type === "team_invitation" ? (
                        <>
                          {n.message.split('"').map((part, i) => 
                            i % 2 === 1 ? (
                              <Link 
                                key={i} 
                                href={`/discover/teams/${(n as any).teamId}`}
                                className="font-bold text-neutral-900 hover:text-yellow-600 hover:underline dark:text-white dark:hover:text-yellow-400"
                                onClick={(e) => e.stopPropagation()}
                              >
                                "{part}"
                              </Link>
                            ) : (
                              part
                            )
                          )}
                        </>
                      ) : (
                        n.message
                      )}
                    </p>

                    {/* Actions for Invites / Requests */}
                    {hasActionableItems(n) && (!((n as any).inviteStatus) || (n as any).inviteStatus === 'pending') && (
                      <div className="flex flex-wrap gap-3 pt-4">
                        {n.actions!.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(n, action);
                            }}
                            disabled={processingAction === n.id}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-70 ${
                              action.action.includes("ACCEPT")
                                ? "bg-yellow-400 text-neutral-900 hover:bg-yellow-500 hover:shadow-lg"
                                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            }`}
                          >
                            {processingAction === n.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : action.action.includes("ACCEPT") ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            {processingAction === n.id ? "Processing..." : action.label}
                          </button>
                        ))}
                        
                        {n.entity_type === "team" && n.entity_id && (
                          <Link
                            href={`/discover/teams/${n.entity_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-transparent bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                          >
                            View Team
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Processed State for Invites & Requests */}
                    {(n.entity_type === 'team_invitation' || n.entity_type === 'team_join_request') && (n as any).inviteStatus && (n as any).inviteStatus !== 'pending' && (
                        <div className="mt-3 flex items-center gap-2 text-sm font-medium">
                            {(n as any).inviteStatus === 'accepted' ? (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <Check className="h-4 w-4" /> {n.entity_type === 'team_join_request' ? "Member added" : "Joined the team"}
                                </span>
                            ) : (n as any).inviteStatus === 'declined' || (n as any).inviteStatus === 'rejected' ? (
                                <span className="text-red-500 flex items-center gap-1">
                                    <X className="h-4 w-4" /> {n.entity_type === 'team_join_request' ? "Request rejected" : "Declined"}
                                </span>
                            ) : (
                                <span className="text-neutral-500">{(n as any).inviteStatus}</span>
                            )}
                            
                            {(n as any).teamId && (
                                <Link
                                    href={`/discover/teams/${(n as any).teamId}`}
                                    className="ml-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    View Team →
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Processed State */}
                    {!hasActionableItems(n) && (n.type === "member_joined" || n.type === "request_accepted") && (
                      <div className="mt-3">
                        {n.entity_type === "team" && n.entity_id && (
                          <Link
                            href={`/discover/teams/${n.entity_id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-yellow-600 hover:text-yellow-700 dark:text-yellow-500"
                          >
                            View Team →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
