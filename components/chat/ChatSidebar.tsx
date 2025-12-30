import React from "react";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import { clsx } from "clsx";

type Profile = {
    id: string;
    username: string;
    name?: string | null;
};

type Chat = {
    id: string;
    is_group?: boolean;
    title?: string | null;
    other_user?: Profile;
    last_message?: { content: string; created_at: string };
};

type ChatSidebarProps = {
    chats: Chat[];
    selectedChatId: string | null;
    onSelectChat: (id: string) => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    onCreateChat: () => void;
    isOpenMobile: boolean;
    searchResults: Profile[];
    isSearching: boolean;
    onSelectResult: (profile: Profile) => void;
};

export function ChatSidebar({
    chats,
    selectedChatId,
    onSelectChat,
    searchQuery,
    onSearchChange,
    onCreateChat,
    isOpenMobile,
    searchResults,
    isSearching,
    onSelectResult,
}: ChatSidebarProps) {
    return (
        <div
            className={clsx(
                "absolute inset-y-0 left-0 z-40 flex w-full flex-col border-r border-white/20 bg-white/60 backdrop-blur-2xl transition-transform duration-300 dark:bg-black/40 md:relative md:w-80 md:translate-x-0 md:!bg-white/30 md:dark:!bg-black/20",
                isOpenMobile ? "translate-x-0" : "-translate-x-full"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                    Messages
                </h1>
                <button
                    onClick={onCreateChat}
                    className="rounded-full bg-neutral-900 p-2 text-yellow-400 shadow-lg hover:bg-neutral-800 dark:bg-white dark:text-neutral-950"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 bg-white/50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none ring-yellow-400/30 placeholder:text-neutral-500 focus:bg-white focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-neutral-400 dark:focus:bg-black/40"
                    />
                    {/* Search Results Dropdown */}
                    {(searchQuery && (searchResults.length > 0 || isSearching)) && (
                        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white/90 shadow-xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/95">
                            {isSearching && <div className="p-4 text-center text-sm text-neutral-500">Searching...</div>}
                            {!isSearching && searchResults.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => onSelectResult(profile)}
                                    className="flex w-full items-center gap-3 border-b border-neutral-100 last:border-0 p-3 text-left hover:bg-neutral-100 dark:border-white/5 dark:hover:bg-white/10"
                                >
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                        <div className="h-full w-full flex items-center justify-center font-bold text-neutral-500 text-xs">
                                            {profile.username[0]?.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                            {profile.name || profile.username}
                                        </div>
                                        <div className="text-xs text-neutral-500 truncate">@{profile.username}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                <div className="space-y-2">
                    {chats.map((chat) => (
                        <motion.button
                            key={chat.id}
                            layoutId={`chat-${chat.id}`}
                            onClick={() => onSelectChat(chat.id)}
                            className={clsx(
                                "group relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all",
                                selectedChatId === chat.id
                                    ? "bg-white shadow-md dark:bg-white/10"
                                    : "hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                        >
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                    {chat.is_group 
                                        ? (chat.title ? chat.title.charAt(0).toUpperCase() : 'G') 
                                        : (chat.other_user?.username.charAt(0).toUpperCase() || '?')
                                    }
                                </div>
                                {!chat.is_group && (
                                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className={clsx("font-semibold truncate", selectedChatId === chat.id ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-200")}>
                                        {chat.is_group ? chat.title : (chat.other_user?.name || chat.other_user?.username || 'Unknown')}
                                    </span>

                                </div>
                                <p className={clsx("truncate text-sm", selectedChatId === chat.id ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-500 dark:text-neutral-400")}>
                                    {chat.last_message?.content || "Start a conversation"}
                                </p>
                            </div>

                            {/* Active Indicator Bar */}
                            {selectedChatId === chat.id && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-yellow-400"
                                />
                            )}
                        </motion.button>
                    ))}

                    {chats.length === 0 && (
                        <div className="pt-10 text-center text-sm text-neutral-500">
                            No chats yet. Start one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
