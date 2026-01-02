import React from "react";
import { Users, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  members: any[];
  onlineUsers: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

export function ChatSidebar({ members, onlineUsers, isOpen, onClose, currentUserId }: ChatSidebarProps) {
  // Sort: Online first, then alphabetical
  const sortedMembers = [...members].sort((a, b) => {
    const aOnline = !!onlineUsers[a.user_id];
    const bOnline = !!onlineUsers[b.user_id];
    if (aOnline === bOnline) return (a.username || "").localeCompare(b.username || "");
    return aOnline ? -1 : 1;
  });

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        className={cn(
          "absolute right-0 top-0 h-full w-80 border-l border-neutral-200/50 bg-white/50 backdrop-blur-md transition-transform duration-300 dark:border-neutral-800/50 dark:bg-black/50 lg:relative lg:translate-x-0 z-30",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          // On large screens, we might want it always visible or toggleable. For now, assume responsive drawer on mobile, static on desktop
          "flex flex-col"
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200/50 px-6 py-4 dark:border-neutral-800/50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-500" />
            <span className="font-bold text-neutral-900 dark:text-white">Members</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {members.length}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-2">
          {sortedMembers.map((member) => {
            const isOnline = !!onlineUsers[member.user_id];
            const isMe = member.user_id === currentUserId;

            return (
              <div
                 key={member.id} // or member.user_id
                 className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                    {member.name?.[0]?.toUpperCase() || member.username?.[0]?.toUpperCase()}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-black" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                     <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {isMe ? "You" : (member.name || member.username)}
                     </p>
                     {member.role === 'leader' && <span className="text-[10px] text-yellow-600 bg-yellow-100 px-1.5 rounded dark:bg-yellow-900/30 dark:text-yellow-500">Owner</span>}
                  </div>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    @{member.username}
                  </p>
                </div>

                {!isMe && (
                   <Link
                     href={`/profile/${member.username}`}
                     className="invisible group-hover:visible p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                   >
                      <ArrowRightIcon />
                   </Link>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

function ArrowRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    )
}
