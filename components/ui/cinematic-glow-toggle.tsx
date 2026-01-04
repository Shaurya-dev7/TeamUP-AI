"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CinematicSwitch() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-[68px] h-[42px]" />; // Placeholder to prevent hydration mismatch
    }

    const isDark = resolvedTheme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <div className="flex items-center justify-center">
            {/* Switch Container */}
            <div
                className="flex items-center gap-3 p-2 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={toggleTheme}
            >
                {/* 'LIGHT' Label */}
                <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${!isDark ? "text-zinc-900" : "text-zinc-400"}`}>
                    LIGHT
                </span>

                {/* Switch Track */}
                <motion.div
                    className="relative w-12 h-6 rounded-full shadow-inner"
                    initial={false}
                    animate={{
                        backgroundColor: isDark ? "#27272a" : "#e4e4e7", // Zinc-800 (Dark) vs Zinc-200 (Light)
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Switch Thumb */}
                    <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full border border-black/5 dark:border-white/10 shadow-md"
                        initial={false}
                        animate={{
                            x: isDark ? 24 : 0,
                            backgroundColor: isDark ? "#facc15" : "#18181b", // Yellow-400 (Dark Mode) vs Zinc-900 (Light Mode)
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Thumb Highlight (Gloss) */}
                        <div className="absolute top-0.5 left-1 w-1.5 h-0.5 bg-white/40 rounded-full blur-[0.5px]" />
                    </motion.div>
                </motion.div>

                {/* 'DARK' Label */}
                <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${isDark ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-zinc-400"}`}>
                    DARK
                </span>
            </div>
        </div>
    );
}
