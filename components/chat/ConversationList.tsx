import React from 'react';
import { Check, CheckCheck, User, Users } from 'lucide-react';
import { Skeleton } from "@/components/ui/Skeleton";

export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  title?: string | null;
  icon_url?: string | null;
  updated_at: string;
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string; 
    status?: 'sent' | 'delivered' | 'read';
  };
  unread_count: number;
  // For direct chats, we need the other person's details
  other_user?: {
    id: string;
    username: string;
    name?: string | null;
    avatar_url?: string | null;
    is_online?: boolean;  // Optional presence
  };
  participants?: any[];
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
};

export function ConversationList({ conversations, selectedId, onSelect, isLoading }: ConversationListProps) {
  if (isLoading) {
     return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 mx-2 rounded-xl">
                    <Skeleton className="size-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                    </div>
                </div>
            ))}
        </div>
     );
  }

  if (conversations.length === 0) {
    return (
        <div className="p-8 text-center flex flex-col items-center opacity-60">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">No conversations yet.</p>
            <p className="text-neutral-400 text-xs mt-1">Start a chat from the Discover page!</p>
        </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const displayName = conv.type === 'group' 
            ? conv.title 
            : (conv.other_user?.name || conv.other_user?.username || 'Unknown User');
        
        const displayAvatar = conv.type === 'group'
            ? null // handled by icon below
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user?.username || 'unknown'}`;
            
        const timeDisplay = conv.last_message 
            ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`
                group flex items-center gap-3 p-3 mx-2 rounded-xl cursor-pointer transition-all
                ${isSelected 
                    ? 'bg-neutral-100 dark:bg-neutral-800 shadow-sm' 
                    : 'hover:bg-neutral-50 dark:hover:bg-white/5'}
            `}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
               <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex items-center justify-center border border-neutral-100 dark:border-neutral-600">
                  {conv.type === 'group' ? (
                     <Users className="w-6 h-6 text-neutral-500 dark:text-neutral-300" />
                  ) : (
                     <img src={displayAvatar!} alt={displayName || 'User'} className="w-full h-full object-cover" />
                  )}
               </div>
               {/* Online Indicator (Direct Only) */}
               {conv.type === 'direct' && conv.other_user?.is_online && (
                   <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
               )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className={`font-semibold truncate text-sm ${isSelected ? 'text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-200'}`}>
                            {displayName}
                        </h3>
                        {conv.unread_count > 0 && (
                            <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold px-1.5 h-4 min-w-[1rem] flex items-center justify-center rounded-full shadow-sm animate-in zoom-in duration-200">
                                {conv.unread_count}
                            </span>
                        )}
                    </div>
                    {conv.last_message && (
                        <span className={`text-[10px] shrink-0 ml-2 ${isSelected ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {timeDisplay}
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate pr-2 flex items-center gap-1">
                        {conv.last_message ? (
                            <>
                                {/* Status Ticks for Last Message (if sent by me - logic needed upstream, assume we just show content for now) */}
                                {conv.type === 'group' && <span className="text-neutral-400 font-bold text-[10px]">{conv.last_message.sender_id === conv.other_user?.id ? '' : 'You: '}</span>}
                                {conv.last_message.content}
                            </>
                        ) : (
                            <span className="italic opacity-80">Draft</span>
                        )}
                    </p>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
