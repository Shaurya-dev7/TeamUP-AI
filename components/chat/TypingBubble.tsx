import React from "react";
import { motion } from "framer-motion";

export function TypingBubble() {
    return (
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-white/10 px-3 py-2.5 rounded-2xl rounded-tl-none w-fit shadow-sm">
            <motion.div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
        </div>
    );
}
