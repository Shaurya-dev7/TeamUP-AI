"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export const BackgroundEffects = () => {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Disable snow on Chat and Auth pages
    const isCleanPage = pathname?.startsWith('/chat') || pathname === '/login' || pathname === '/signup';

    // Generate deterministic random values for particles so they are consistent after mount
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 10,
        size: 2 + Math.random() * 4,
    }));

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* --- GLASSY GRADIENT ORBS --- */}
            {/* Purple Blob - Top Left */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                    x: [0, 50, 0],
                    y: [0, 30, 0] 
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-400/40 dark:bg-purple-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
            />
            {/* Green Blob - Bottom Right */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                    x: [0, -40, 0],
                    y: [0, -40, 0] 
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-yellow-400/40 dark:bg-emerald-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
            />
             {/* Extra Glassy Overlay for Texture */}
             <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-[100px] opacity-50" />
            
             {/* --- FALLING PARTICLES (SNOW/DUST) --- */}
             {!isCleanPage && (
                 <div className="absolute inset-0">
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ 
                                y: ["0vh", "100vh"],
                                opacity: [0, 1, 1, 0],
                                rotate: [0, 360]
                            }}
                            transition={{ 
                                duration: p.duration, 
                                repeat: Infinity, 
                                delay: p.delay, 
                                ease: "linear" 
                            }}
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size,
                            }}
                            className="absolute rounded-full bg-neutral-900/10 dark:bg-white/20 backdrop-blur-sm"
                        />
                    ))}
                 </div>
             )}

             {/* Grid Pattern Overlay */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] dark:opacity-[0.05]" />
        </div>
    );
};
