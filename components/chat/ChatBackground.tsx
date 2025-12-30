import React from 'react';

export const ChatBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* LIGHT MODE - Stronger Visibility */}
            <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-700 bg-neutral-100">
                <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-blue-500/40 rounded-full blur-[100px] animate-float-slow mix-blend-multiply"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-500/40 rounded-full blur-[100px] animate-float-medium mix-blend-multiply"></div>
                <div className="absolute top-[30%] left-[40%] w-[50%] h-[50%] bg-yellow-400/30 rounded-full blur-[100px] animate-float-fast mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-grid-black opacity-40"></div>
            </div>

            {/* DARK MODE - Black/Gold Theme */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700 dark:opacity-100">
                <div className="absolute inset-0 bg-neutral-950" />

                {/* Animated Orbs - Warm Gold & Deep Grey */}
                <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-pulse-glow rounded-full bg-yellow-600/20 blur-[120px]" />
                <div className="absolute -right-20 top-40 h-[400px] w-[400px] animate-float-slow rounded-full bg-neutral-800/60 blur-[100px]" />
                <div className="absolute bottom-0 left-1/3 h-[600px] w-[600px] animate-float-medium rounded-full bg-yellow-900/10 blur-[130px]" />
                <div className="absolute -bottom-20 -right-20 h-[500px] w-[500px] animate-float-fast rounded-full bg-neutral-900/80 blur-[120px]" />

                {/* Central Spotlight - Golden Faint */}
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 transform bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15),transparent_70%)] blur-3xl" />

                {/* Particles / Stars */}
                <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:50px_50px] opacity-20" />

                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />
            </div>
        </div>
    );
};
