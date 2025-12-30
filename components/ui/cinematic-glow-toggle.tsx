"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Theme = "dark" | "light";

export default function CinematicSwitch() {
    const [isOn, setIsOn] = useState(false); // isOn = Dark Mode

    useEffect(() => {
        // Initialize state from existing theme logic
        const saved = (localStorage.getItem("teamup-theme") as Theme | null);
        const isDark = saved === "dark" || (!saved && document.documentElement.classList.contains("dark"));
        setIsOn(isDark);
    }, []);

    const toggleTheme = () => {
        const nextState = !isOn;
        setIsOn(nextState);
        
        const root = document.documentElement;
        const nextTheme = nextState ? "dark" : "light";
        
        if (nextTheme === "dark") root.classList.add("dark");
        else root.classList.remove("dark");
        
        localStorage.setItem("teamup-theme", nextTheme);
    };

    return (
        <div className="flex items-center justify-center">
            {/* Switch Container */}
            <div
                className="flex items-center gap-3 p-2 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={toggleTheme}
            >
                {/* 'LIGHT' Label */}
                <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${!isOn ? "text-zinc-900" : "text-zinc-400"}`}>
                    LIGHT
                </span>

                {/* Switch Track */}
                <motion.div
                    className="relative w-12 h-6 rounded-full shadow-inner"
                    initial={false}
                    animate={{
                        backgroundColor: isOn ? "#27272a" : "#e4e4e7", // Zinc-800 (Dark) vs Zinc-200 (Light)
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Switch Thumb */}
                    <motion.div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full border border-black/5 dark:border-white/10 shadow-md"
                        initial={false}
                        animate={{
                            x: isOn ? 24 : 0,
                            backgroundColor: isOn ? "#facc15" : "#18181b", // Yellow-400 (Dark Mode) vs Zinc-900 (Light Mode)
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {/* Thumb Highlight (Gloss) */}
                        <div className="absolute top-0.5 left-1 w-1.5 h-0.5 bg-white/40 rounded-full blur-[0.5px]" />
                    </motion.div>
                </motion.div>

                {/* 'DARK' Label */}
                <span className={`text-[10px] font-bold tracking-wider transition-colors duration-300 ${isOn ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-zinc-400"}`}>
                    DARK
                </span>
            </div>
        </div>
    );
}
