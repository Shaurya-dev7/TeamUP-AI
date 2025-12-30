import React from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type Message = {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
};

type MessageBubbleProps = {
    message: Message;
    isMe: boolean;
};

export function MessageBubble({ message, isMe }: MessageBubbleProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={clsx(
                "flex w-full mb-4",
                isMe ? "justify-end" : "justify-start"
            )}
        >
            <div
                className={twMerge(
                    "max-w-[70%] break-words rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md",
                    isMe
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-neutral-950 font-medium rounded-tr-sm"
                        : "bg-white/10 dark:bg-white/5 border border-white/20 text-neutral-900 dark:text-neutral-100 rounded-tl-sm dark:border-white/10"
                )}
            >
                {message.content}
                <div
                    className={clsx(
                        "mt-1 text-[10px] opacity-60 text-right",
                        isMe ? "text-neutral-900" : "text-neutral-500 dark:text-neutral-400"
                    )}
                >
                    {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
        </motion.div>
    );
}
