import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check, CheckCheck, MoreHorizontal, Reply, Copy, Trash2, MapPin, Pin, PinOff } from "lucide-react";

export type Message = {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    status?: 'sent' | 'delivered' | 'read';
    message_type?: 'text' | 'image' | 'file' | 'location';
    file_url?: string | null;
    is_me?: boolean;
    is_pinned?: boolean;
    pinned_by?: string;
    conversation_id?: string;
};

type MessageBubbleProps = {
    message: Message;
    isMe: boolean;
    senderName?: string;
    showName?: boolean;
    onReply?: (msg: Message) => void;
    onDelete?: (msgId: string) => void;
    onPin?: (msgId: string, currentStatus: boolean) => void;
    onJumpTo?: (msgId: string) => void;
    isAdmin?: boolean;
};

export function MessageBubble({ message, isMe, senderName, showName, onReply, onDelete, onPin, onJumpTo, isAdmin }: MessageBubbleProps) {
    const [showMenu, setShowMenu] = useState(false);
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const isDeleted = message.content === "🚫 This message was deleted";
    const isLocation = message.message_type === 'location';

    // Parse Reply Quote
    // Format: > [reply:ID] Quote... OR > Quote...
    const isReply = message.content.startsWith("> ");
    let replyText = "";
    let replyId: string | undefined;
    let mainContent = message.content;
    
    if (isReply) {
        const parts = message.content.split("\n");
        const quoteLine = parts[0];
        
        // Check for hidden ID
        const match = quoteLine.match(/^> \[reply:(.*?)\] (.*)/);
        if (match) {
            replyId = match[1];
            replyText = match[2];
        } else {
            replyText = quoteLine.replace("> ", "");
        }
        
        mainContent = parts.slice(1).join("\n").trim();
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(mainContent);
        setShowMenu(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={clsx(
                "group flex flex-col w-full mb-1 relative", // tighter spacing
                isMe ? "items-end" : "items-start"
            )}
            onMouseLeave={() => setShowMenu(false)}
        >
            {/* Sender Name for Group Chats */}
            {showName && (
                <span className={clsx(
                    "text-[10px] font-bold ml-3 mb-1",
                    isMe ? "text-neutral-900/50 dark:text-white/50 self-end mr-3" : "text-neutral-500"
                )}>
                    {isMe ? "You" : senderName}
                </span>
            )}

            <div className="relative max-w-[85%] sm:max-w-[70%] flex items-end gap-2 group">
                
                {/* Menu Button (Left for Me, Right for Others) */}
                {isMe && !isDeleted && (
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                )}

                <div
                    className={twMerge(
                        "relative break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm backdrop-blur-md transition-all",
                        isMe
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-neutral-950 font-medium rounded-tr-sm"
                            : "bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-neutral-100 rounded-tl-sm",
                        isDeleted && "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 italic border-neutral-200 dark:border-neutral-800",
                        message.is_pinned && "ring-2 ring-blue-500/50 shadow-blue-500/20"
                    )}
                >
                    {/* Pinned Indicator */}
                    {message.is_pinned && (
                         <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-sm transform rotate-12">
                            <Pin className="w-3 h-3" />
                         </div>
                    )}

                    {/* Reply Context */}
                    {isReply && !isDeleted && (
                        <div 
                            onClick={(e) => {
                                if (replyId && onJumpTo) {
                                    e.stopPropagation();
                                    onJumpTo(replyId);
                                }
                            }}
                            className={clsx(
                                "mb-2 pl-2 border-l-2 border-black/10 dark:border-white/20 text-xs opacity-70 line-clamp-1 bg-black/5 dark:bg-white/5 p-1 rounded-sm",
                                replyId && onJumpTo && "cursor-pointer hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                            )}
                        >
                            {replyText}
                        </div>
                    )}

                    {/* Media Content */}
                    {message.message_type === 'image' && message.file_url && !isDeleted && (
                        <div className="mb-2 -mx-2 -mt-2 rounded-t-xl overflow-hidden">
                            <img src={message.file_url} alt="Shared" className="w-full h-auto max-h-80 object-cover" />
                        </div>
                    )}
                    
                    {/* Location Content */}
                    {isLocation && !isDeleted && (
                        <a 
                            href={message.content} // Map link stored in content
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 underline font-medium mb-1"
                        >
                            <MapPin className="w-4 h-4" />
                            Live Location
                        </a>
                    )}

                    {message.message_type === 'file' && !isDeleted && (
                         <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/10 rounded-xl mb-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg text-xs font-bold uppercase border border-black/10">
                                FILE
                            </div>
                            <div className="flex-1 min-w-0">
                                <a href={message.file_url || '#'} target="_blank" rel="noopener noreferrer" className="block font-bold hover:underline truncate">
                                    Download File
                                </a>
                                <span className="text-[10px] opacity-70">Click to open</span>
                            </div>
                         </div>
                    )}

                    {/* Text Content */}
                    <span className="whitespace-pre-wrap">
                        {isLocation ? "See my location on Google Maps" : mainContent}
                    </span>
                    
                    {/* Footer: Time & Status */}
                    <div className="flex items-center justify-end gap-1 mt-1 select-none">
                        <span
                            className={clsx(
                                "text-[10px] opacity-60",
                                isMe ? "text-neutral-900" : "text-neutral-500 dark:text-neutral-400"
                            )}
                        >
                            {time}
                        </span>
                        {isMe && !isDeleted && (
                            <span className={clsx(
                                "opacity-80", 
                                message.status === 'read' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-700'
                            )}>
                                {message.status === 'read' ? <CheckCheck className="w-3.5 h-3.5" /> : 
                                 message.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : 
                                 <Check className="w-3.5 h-3.5" />}
                            </span>
                        )}
                    </div>
                </div>

                {/* Menu Button (Right for Others) */}
                {!isMe && !isDeleted && (
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                )}

                {/* Context Menu Dropdown */}
                <AnimatePresence>
                    {showMenu && !isDeleted && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={clsx(
                                "absolute z-50 bottom-full mb-2 bg-white dark:bg-neutral-800 shadow-xl rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col min-w-[140px]",
                                isMe ? "right-0" : "left-0"
                            )}
                        >
                            <button onClick={() => { onReply?.(message); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white text-left transition-colors">
                                <Reply className="w-4 h-4" /> Reply
                            </button>
                            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white text-left transition-colors">
                                <Copy className="w-4 h-4" /> Copy
                            </button>

                            <button onClick={() => { onPin?.(message.id, !!message.is_pinned); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-white text-left transition-colors">
                                {message.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />} 
                                {message.is_pinned ? "Unpin" : "Pin"}
                            </button>

                            {(isMe || isAdmin) && (
                                <button onClick={() => { onDelete?.(message.id); setShowMenu(false); }} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left transition-colors border-t border-neutral-100 dark:border-neutral-700">
                                    <Trash2 className="w-4 h-4" /> Delete
                                    {isAdmin && !isMe && <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-1 rounded">Admin</span>}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
