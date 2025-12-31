import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check, CheckCheck } from "lucide-react";

export type Message = {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    status?: 'sent' | 'delivered' | 'read';
    message_type?: 'text' | 'image' | 'file';
    file_url?: string | null;
    is_me?: boolean;
};

type MessageBubbleProps = {
    message: Message;
    isMe: boolean;
    senderName?: string;
    showName?: boolean;
};

export function MessageBubble({ message, isMe, senderName, showName }: MessageBubbleProps) {
    const time = new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={clsx(
                "flex flex-col w-full mb-2", // tighter spacing
                isMe ? "items-end" : "items-start"
            )}
        >
            {/* Sender Name for Group Chats */}
            {showName && senderName && !isMe && (
                <span className="text-[10px] font-bold text-neutral-500 ml-3 mb-1">
                    {senderName}
                </span>
            )}

            <div
                className={twMerge(
                    "relative max-w-[75%] sm:max-w-[65%] break-words rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm backdrop-blur-md",
                    isMe
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-neutral-950 font-medium rounded-tr-sm"
                        : "bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-neutral-100 rounded-tl-sm"
                )}
            >
                {/* Media Content */}
                {message.message_type === 'image' && message.file_url && (
                    <div className="mb-2 -mx-2 -mt-2 rounded-t-xl overflow-hidden">
                        <img src={message.file_url} alt="Shared" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                )}
                
                {message.message_type === 'file' && (
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
                <span className="whitespace-pre-wrap">{message.content}</span>
                
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
                    {isMe && (
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
        </motion.div>
    );
}
