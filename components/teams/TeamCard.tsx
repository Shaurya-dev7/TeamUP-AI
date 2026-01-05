import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Lock, Unlock, ChevronRight, Sparkles, UserPlus, Loader2, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id?: string;
  avatar_url?: string | null;
  name?: string | null;
  username?: string;
}

interface TeamCardProps {
  id: number;
  name: string;
  goal?: string | null;
  description?: string | null;
  is_private: boolean;
  max_members: number;
  member_count: number;
  roles_needed?: string[];
  join_mode?: "open" | "request" | "closed";
  has_pending_request?: boolean;
  is_member?: boolean;
  banner_url?: string | null;
  leader?: TeamMember | null;
  members?: TeamMember[];
}

export default function TeamCard({
  id,
  name,
  goal,
  description,
  is_private,
  max_members,
  member_count,
  roles_needed = [],
  join_mode = "open",
  has_pending_request = false,
  is_member = false,
  banner_url,
  leader,
  members = [],
}: TeamCardProps) {
  const isFull = member_count >= max_members;

  // Unique team icons/logos
  const teamIcons = [
    "🚀", "⚡", "🔥", "💎", "🎯", "🌟", "🏆", "💡", 
    "🎨", "🔮", "🌈", "🎭", "🦄", "🐉", "🦅", "🐺",
    "🌍", "🛡️", "⚔️", "🎪", "🎲", "🎸", "🎬", "📡",
    "🔬", "🧬", "🤖", "👾", "🎮", "💻", "🌐", "🔒",
  ];

  // Premium gradient themes based on ID
  const themes = [
    {
      gradient: "from-violet-600 via-purple-600 to-indigo-700",
      glow: "shadow-violet-500/25",
      accent: "bg-violet-500",
      text: "text-violet-400",
      badge: "from-violet-500 to-purple-600",
    },
    {
      gradient: "from-cyan-500 via-teal-500 to-emerald-600",
      glow: "shadow-teal-500/25",
      accent: "bg-teal-500",
      text: "text-teal-400",
      badge: "from-teal-500 to-emerald-600",
    },
    {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      glow: "shadow-orange-500/25",
      accent: "bg-orange-500",
      text: "text-orange-400",
      badge: "from-orange-500 to-amber-500",
    },
    {
      gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
      glow: "shadow-rose-500/25",
      accent: "bg-rose-500",
      text: "text-rose-400",
      badge: "from-rose-500 to-pink-600",
    },
    {
      gradient: "from-blue-500 via-indigo-500 to-violet-600",
      glow: "shadow-blue-500/25",
      accent: "bg-blue-500",
      text: "text-blue-400",
      badge: "from-blue-500 to-indigo-600",
    },
    {
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      glow: "shadow-emerald-500/25",
      accent: "bg-emerald-500",
      text: "text-emerald-400",
      badge: "from-emerald-500 to-green-600",
    },
  ];

  const theme = themes[id % themes.length];
  const teamIcon = teamIcons[id % teamIcons.length];

  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient();

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please sign in to join teams.");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/teams/${id}/join-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: "I'd like to join your team!" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      if (data.joined) {
        alert("Success! You have joined the team.");
      } else {
        alert("Request sent successfully! The team leader will review it.");
      }
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayMembers = members.slice(0, 4);
  const remainingCount = Math.max(0, member_count - 4);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="h-full perspective-1000"
    >
      <Link
        href={`/discover/teams/${id}`}
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 shadow-xl ${theme.glow} hover:shadow-2xl transition-all duration-500`}
      >
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
        
        {/* Banner Section with Overlay Effects */}
        <div className="relative h-32 overflow-hidden">
          {/* Gradient Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
          
          {/* Banner Image if exists */}
          {banner_url && (
            <Image
              src={banner_url}
              alt={`${name} banner`}
              fill
              className="object-cover mix-blend-overlay opacity-60"
            />
          )}
          
          {/* Animated mesh pattern overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Glow effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4 z-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-xl border ${
                has_pending_request
                  ? "bg-neutral-900/60 border-neutral-700 text-neutral-200"
                  : is_private || join_mode === "closed"
                  ? "bg-neutral-900/60 border-neutral-700 text-neutral-300"
                  : "bg-white/90 dark:bg-white/10 border-white/20 text-neutral-900 dark:text-white"
              }`}
            >
              {has_pending_request ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Pending
                </>
              ) : is_private || join_mode === "closed" ? (
                <>
                  <Lock className="h-3 w-3" /> Private
                </>
              ) : (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Open
                </>
              )}
            </motion.div>
          </div>

          {/* Team Logo/Icon Badge */}
          <div className="absolute top-4 left-4 z-10">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg"
            >
              <span className="text-2xl">{teamIcon}</span>
            </motion.div>
          </div>

          {/* Leader Avatar - Floating */}
          {leader && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="absolute -bottom-6 left-5 z-20"
            >
              <div className="relative group/avatar">
                <div className={`h-14 w-14 rounded-2xl border-4 border-white dark:border-neutral-900 shadow-xl ${theme.accent} overflow-hidden ring-2 ring-white/20`}>
                  {leader.avatar_url ? (
                    <Image
                      src={leader.avatar_url}
                      alt={leader.name || "Leader"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white font-bold text-xl">
                      {(leader.name || leader.username || "L")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Crown */}
                <div className="absolute -top-2 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 border-2 border-white dark:border-neutral-900 flex items-center justify-center shadow-lg">
                  <Crown className="h-3 w-3 text-amber-900" />
                </div>
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                  <div className="px-2 py-1 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-medium whitespace-nowrap">
                    {leader.name || leader.username || "Leader"}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="relative flex flex-1 flex-col p-5 pt-10">
          {/* Team Name */}
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white leading-tight line-clamp-1 mb-1 group-hover:bg-gradient-to-r group-hover:from-neutral-900 group-hover:to-neutral-600 dark:group-hover:from-white dark:group-hover:to-neutral-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
            {name}
          </h3>
          
          {/* Goal/Description */}
          {(goal || description) && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">
              {goal || description}
            </p>
          )}

          {/* Skills/Roles Tags */}
          {roles_needed.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {roles_needed.slice(0, 3).map((role) => (
                <span
                  key={role}
                  className={`px-2.5 py-1 rounded-lg bg-gradient-to-r ${theme.badge} text-white text-[10px] font-bold uppercase tracking-wide shadow-sm`}
                >
                  {role}
                </span>
              ))}
              {roles_needed.length > 3 && (
                <span className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-[10px] font-bold">
                  +{roles_needed.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              {/* Member Avatars Stack */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {displayMembers.length > 0 ? (
                    displayMembers.map((member, i) => (
                      <motion.div
                        key={member.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`h-8 w-8 rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden shadow-md ${theme.accent}`}
                      >
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt="Member"
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white text-[11px] font-bold">
                            {(member.name || member.username || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    Array.from({ length: Math.min(3, member_count) }).map((_, i) => (
                      <div key={i} className={`h-8 w-8 rounded-full border-2 border-white dark:border-neutral-900 ${theme.accent}`} />
                    ))
                  )}
                  {remainingCount > 0 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shadow-md">
                      <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">+{remainingCount}</span>
                    </div>
                  )}
                </div>
                
                {/* Member Count */}
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isFull ? "text-red-500" : "text-neutral-900 dark:text-white"}`}>
                    {member_count}/{max_members}
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wide">Members</span>
                </div>
              </div>

              {/* Action Button */}
              {is_member ? (
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-200 transition-all hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  Open <ChevronRight className="h-4 w-4" />
                </motion.div>
              ) : !isFull && !has_pending_request && (join_mode === "open" || join_mode === "request") ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAction}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  } ${
                    join_mode === "open"
                      ? `bg-gradient-to-r ${theme.badge} text-white ${theme.glow}`
                      : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-neutral-900/20"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : join_mode === "open" ? (
                    <UserPlus className="h-4 w-4" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isLoading ? "..." : join_mode === "open" ? "Join" : "Apply"}
                </motion.button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className={`flex items-center gap-1 text-sm font-bold ${theme.text}`}
                >
                  View <ChevronRight className="h-4 w-4" />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${theme.gradient} blur-3xl -z-10 scale-150`} />
      </Link>
    </motion.div>
  );
}
