import React from "react";
import Link from "next/link";
import { Users, Lock, Unlock, ChevronRight, Star, Sparkles, UserPlus, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface TeamCardProps {
  id: number;
  name: string;
  goal?: string | null;
  is_private: boolean;
  max_members: number;
  member_count: number;
  roles_needed?: string[];
  join_mode?: 'open' | 'request' | 'closed';
  has_pending_request?: boolean;
  is_member?: boolean;
}

export default function TeamCard({
  id,
  name,
  goal,
  is_private,
  max_members,
  member_count,
  roles_needed = [],
  join_mode = 'open',
  has_pending_request = false,
  is_member = false,
}: TeamCardProps) {
  const isFull = member_count >= max_members;
  
  // Deterministic gradient based on ID
  const gradients = [
    "from-blue-500/20 via-indigo-500/20 to-purple-500/20 border-indigo-200/50 dark:border-indigo-800/50",
    "from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-emerald-200/50 dark:border-emerald-800/50",
    "from-orange-500/20 via-amber-500/20 to-yellow-500/20 border-orange-200/50 dark:border-orange-800/50",
    "from-pink-500/20 via-rose-500/20 to-red-500/20 border-pink-200/50 dark:border-pink-800/50",
    "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 border-violet-200/50 dark:border-violet-800/50",
  ];
  
  const accentColors = [
    "bg-indigo-500 text-white shadow-indigo-500/25",
    "bg-emerald-500 text-white shadow-emerald-500/25",
    "bg-orange-500 text-white shadow-orange-500/25",
    "bg-rose-500 text-white shadow-rose-500/25",
    "bg-violet-500 text-white shadow-violet-500/25",
  ];
  
  const textColors = [
    "text-indigo-600 dark:text-indigo-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-orange-600 dark:text-orange-400",
    "text-rose-600 dark:text-rose-400",
    "text-violet-600 dark:text-violet-400",
  ];

  const gradientIndex = id % gradients.length;
  const gradientClass = gradients[gradientIndex];
  const accentClass = accentColors[gradientIndex];
  const textClass = textColors[gradientIndex];

  // Logic for Join/Request
  const [isLoading, setIsLoading] = React.useState(false);
  const supabase = createClient(); // Ensure createClient is imported from '@/lib/supabase/client'

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click
    e.stopPropagation();

    setIsLoading(true);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // Determine if redirect logic is needed or just alert
            alert("Please sign in to join teams.");
            setIsLoading(false);
            return;
        }

        const res = await fetch(`/api/teams/${id}/join-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ message: "I'd like to join your team!" }) // Default message for quick apply
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || "Failed to process request");
        }

        // Success Feedback
        if (data.joined) {
            alert("Success! You have joined the team.");
            // Ideally trigger a refresh of the parent list here, but for now simple feedback
             window.location.reload(); // Simple reload to reflect state
        } else {
            alert("Request sent successfully! The team leader will review it.");
             window.location.reload(); // Simple reload to reflect state
        }

    } catch (error: any) {
        alert(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link
        href={`/discover/teams/${id}`}
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-2xl ${gradientClass}`}
      >
        {/* Background Decorative Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-30 transition-opacity group-hover:opacity-50`} />
        
        {/* Card Content */}
        <div className="relative flex flex-1 flex-col p-6">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${accentClass}`}>
              <Users className="h-6 w-6" />
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md shadow-sm border ${
                  has_pending_request 
                    ? "bg-neutral-100/80 border-neutral-200 text-neutral-600 dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-neutral-400"
                    : is_private || join_mode === 'closed'
                    ? "bg-neutral-100/80 border-neutral-200 text-neutral-600 dark:bg-neutral-800/80 dark:border-neutral-700 dark:text-neutral-400"
                    : "bg-white/80 border-green-200 text-green-600 dark:bg-neutral-900/80 dark:border-green-900 dark:text-green-400"
                }`}
              >
                {has_pending_request ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> Applied
                  </>
                ) : is_private || join_mode === 'closed' ? (
                  <>
                    <Lock className="h-3 w-3" /> Closed
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" /> Open
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Title & Goal */}
          <div className="mb-6">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  #{id}
                </span>
             </div>
            <h3 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white transition-colors group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-neutral-900 group-hover:to-neutral-600 dark:group-hover:from-white dark:group-hover:to-neutral-300">
              {name}
            </h3>
            {goal ? (
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {goal}
              </p>
            ) : (
                <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No goal set yet</p>
            )}
          </div>

          {/* Roles */}
          {roles_needed.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {roles_needed.slice(0, 3).map((role) => (
                <span
                  key={role}
                  className="rounded-lg bg-white/50 dark:bg-black/20 border border-neutral-200/50 dark:border-white/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 shadow-sm"
                >
                  {role}
                </span>
              ))}
              {roles_needed.length > 3 && (
                <span className="text-[10px] font-medium text-neutral-400 flex items-center px-1">
                  +{roles_needed.length - 3}
                </span>
              )}
            </div>
          )}

            {/* Footer Information */}
            <div className="mt-auto flex items-center justify-between border-t border-neutral-200/50 dark:border-white/5 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(3, member_count) }).map((_, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full border-2 border-white dark:border-neutral-900 ${accentClass} opacity-80`} />
                  ))}
                </div>
                <span className={`text-xs font-bold ${isFull ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  {member_count}/{max_members}
                </span>
              </div>

              {/* Action Button */}
              {is_member ? (
                 <div
                  className={`
                    relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-sm
                    bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:-translate-y-0.5 hover:shadow-md
                  `}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  Open Team
                </div>
              ) : !isFull && !has_pending_request && (join_mode === 'open' || join_mode === 'request') ? (
                <div
                  role="button"
                  onClick={(e) => handleAction(e)}
                  className={`
                    relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-sm
                    ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-md active:scale-95'}
                    ${join_mode === 'open' 
                      ? `${accentClass} border border-white/20` 
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }
                  `}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : join_mode === 'open' ? (
                    <UserPlus className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                  {isLoading ? 'Processing...' : join_mode === 'open' ? 'Join Now' : 'Request to Join'}
                </div>
              ) : (
                <div className={`flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${textClass}`}>
                  View Details <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
            
          </div>
        </Link>
      </motion.div>
    );
  }
