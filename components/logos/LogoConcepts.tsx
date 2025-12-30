import React from 'react';

const colors = {
    black: '#0A0A0A',
    darkGrey: '#1F1F1F',
    grey: '#4A4A4A',
    lightGrey: '#A1A1A1',
    yellow: '#FFD700', // Vibrant yellow
    white: '#FFFFFF',
};

export const LogoMinimalist = ({ className = "w-32 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="20" fill={colors.black} />
            {/* Abstract 'T' and Up Arrow combination */}
            <path d="M30 35 H70" stroke={colors.yellow} strokeWidth="8" strokeLinecap="round" />
            <path d="M50 35 V75" stroke={colors.yellow} strokeWidth="8" strokeLinecap="round" />
            <path d="M30 55 L50 35 L70 55" stroke={colors.grey} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6" />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">MINIMALIST</span>
    </div>
);

export const LogoTypography = ({ className = "w-48 h-16" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <svg viewBox="0 0 300 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Background for contrast */}
            <rect width="300" height="100" fill="transparent" />

            {/* Stylized Text */}
            <text x="20" y="65" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.white} letterSpacing="-2">
                TEAM
            </text>
            <text x="190" y="65" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.yellow} letterSpacing="-2">
                UP
            </text>

            {/* Underline accent */}
            <rect x="20" y="75" width="160" height="6" fill={colors.grey} />
            <rect x="190" y="75" width="90" height="6" fill={colors.yellow} />

            {/* Small tech accent */}
            <circle cx="290" cy="35" r="5" fill={colors.yellow} />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">TYPOGRAPHY</span>
    </div>
);

export const LogoSymbol = ({ className = "w-32 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill={colors.darkGrey} stroke={colors.grey} strokeWidth="2" />

            {/* 3 nodes connecting */}
            <circle cx="50" cy="30" r="10" fill={colors.yellow} />
            <circle cx="30" cy="65" r="10" fill={colors.white} />
            <circle cx="70" cy="65" r="10" fill={colors.white} />

            {/* Connecting lines */}
            <line x1="50" y1="30" x2="30" y2="65" stroke={colors.yellow} strokeWidth="4" />
            <line x1="50" y1="30" x2="70" y2="65" stroke={colors.yellow} strokeWidth="4" />
            <line x1="30" y1="65" x2="70" y2="65" stroke={colors.grey} strokeWidth="4" />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">SYMBOL</span>
    </div>
);

export const LogoTypographyHandshake = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        <svg viewBox="0 0 300 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <mask id="textMask">
                    <rect width="300" height="120" fill="white" />
                </mask>
            </defs>

            {/* Handshake Background (Stylized) */}
            <g opacity="0.15">
                {/* Left Hand (White) - Coming from bottom left */}
                <path d="M 50 120 Q 80 80 120 70 L 150 70 Q 160 70 160 60 L 140 40"
                    stroke={colors.white} strokeWidth="20" fill="none" strokeLinecap="round" />

                {/* Right Hand (Yellow) - Coming from top right/side */}
                <path d="M 250 20 Q 220 50 180 60 L 150 60 Q 140 60 140 70 L 160 90"
                    stroke={colors.yellow} strokeWidth="20" fill="none" strokeLinecap="round" />

                {/* Clasping Effect */}
                <circle cx="150" cy="65" r="15" fill={colors.yellow} opacity="0.5" />
            </g>

            {/* Stylized Text (Same as Typography Concept) */}
            <text x="20" y="75" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.white} letterSpacing="-2">
                TEAM
            </text>
            <text x="190" y="75" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.yellow} letterSpacing="-2">
                UP
            </text>

            {/* Underline accent */}
            <rect x="20" y="85" width="160" height="6" fill={colors.grey} />
            <rect x="190" y="85" width="90" height="6" fill={colors.yellow} />

            {/* Small tech accent */}
            <circle cx="290" cy="45" r="5" fill={colors.yellow} />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">REFINED CONCEPT</span>
    </div>
);

export const LogoVariation1 = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* STACKED & COMPACT */}
        <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="180" height="180" x="10" y="10" fill="none" stroke={colors.grey} strokeWidth="2" rx="20" />
            <text x="100" y="90" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.white} textAnchor="middle" letterSpacing="-2">
                TEAM
            </text>
            <text x="100" y="150" fontFamily="sans-serif" fontSize="60" fontWeight="900" fill={colors.yellow} textAnchor="middle" letterSpacing="-2">
                UP
            </text>
            <circle cx="170" cy="30" r="8" fill={colors.yellow} />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">STACKED</span>
    </div>
);

export const LogoVariation2 = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* BRACKETED / CODE STYLE */}
        <svg viewBox="0 0 350 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Opening Bracket */}
            <path d="M 40 20 L 20 20 L 20 80 L 40 80" stroke={colors.yellow} strokeWidth="6" fill="none" />

            <text x="135" y="70" fontFamily="sans-serif" fontSize="50" fontWeight="900" fill={colors.white} textAnchor="middle" letterSpacing="2">
                TEAMUP
            </text>

            {/* Dot accent */}
            <circle cx="230" cy="40" r="5" fill={colors.yellow} />

            {/* Closing Bracket */}
            <path d="M 310 20 L 330 20 L 330 80 L 310 80" stroke={colors.yellow} strokeWidth="6" fill="none" />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">BRACKETED</span>
    </div>
);

export const LogoVariation3 = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* ARROW INTEGRATION */}
        <svg viewBox="0 0 320 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="70" fontFamily="sans-serif" fontSize="70" fontWeight="bold" fill={colors.white} letterSpacing="-3">
                Team
            </text>
            <text x="180" y="70" fontFamily="sans-serif" fontSize="70" fontWeight="bold" fill={colors.yellow} letterSpacing="-3">
                Up
            </text>

            {/* Arrow replacing part of the U or floating above */}
            <path d="M 285 25 L 305 25 L 305 45" stroke={colors.white} strokeWidth="5" fill="none" transform="rotate(-45 295 35)" />
            <line x1="275" y1="55" x2="305" y2="25" stroke={colors.white} strokeWidth="5" />

            <rect x="10" y="85" width="280" height="4" fill={colors.darkGrey} rx="2" />
            <rect x="180" y="85" width="40" height="4" fill={colors.yellow} rx="2" />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">ARROW-ACCENT</span>
    </div>
);

export const LogoTypographyFusion = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* FUSION TYPOGRAPHY */}
        <svg viewBox="0 0 350 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Background gradient/glow effect hint */}
            <defs>
                <linearGradient id="fusionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.white} />
                    <stop offset="50%" stopColor={colors.yellow} />
                    <stop offset="100%" stopColor={colors.white} />
                </linearGradient>
            </defs>

            {/* The word "TEAM" melting/flowing into "UP" */}
            <text x="50" y="80" fontFamily="sans-serif" fontSize="80" fontWeight="900" fill={colors.white} letterSpacing="-4">
                TEAM
            </text>
            {/* Connecting curve */}
            <path d="M 260 50 Q 280 50 280 80" stroke={colors.yellow} strokeWidth="8" fill="none" />

            <text x="280" y="80" fontFamily="sans-serif" fontSize="80" fontWeight="900" fill={colors.yellow} letterSpacing="-4">
                UP
            </text>

            {/* Motion lines */}
            <rect x="50" y="95" width="200" height="4" fill="url(#fusionGrad)" rx="2" />
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">FUSION TYPE</span>
    </div>
);

export const LogoTypographyNegativeSpace = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* NEGATIVE SPACE TYPOGRAPHY */}
        <svg viewBox="0 0 400 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <mask id="textCutout">
                    <rect width="400" height="120" fill="white" />
                    {/* The Hidden Arrow inside the 'A' or 'M' */}
                    {/* Let's put a hidden arrow in the space between E and A or inside A */}
                    {/* Hiding an arrow in the 'A' of TEAM */}
                    <path d="M 160 55 L 140 85 L 180 85 Z" fill="black" />
                    {/* Or simpler: just use text and cutout an arrow from the U */}
                </mask>
            </defs>

            <text x="20" y="100" fontFamily="sans-serif" fontSize="100" fontWeight="900" fill={colors.yellow} letterSpacing="-5" mask="url(#textCutout)">
                TEAM
            </text>
            {/* The UP with a negative space arrow carved out */}
            <g transform="translate(300, 0)">
                <rect x="0" y="20" width="80" height="80" fill={colors.white} rx="10" />
                <path d="M 40 30 L 20 60 H 30 V 90 H 50 V 60 H 60 L 40 30 Z" fill={colors.black} />
            </g>
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">NEGATIVE SPACE</span>
    </div>
);

export const LogoTypographyStructural = ({ className = "w-64 h-32" }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
        {/* STRUCTURAL TYPOGRAPHY */}
        <svg viewBox="0 0 320 120" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Constructing letters with blocks */}

            {/* T */}
            <rect x="10" y="20" width="60" height="15" fill={colors.grey} />
            <rect x="32" y="20" width="15" height="80" fill={colors.white} />

            {/* E */}
            <rect x="80" y="20" width="15" height="80" fill={colors.white} />
            <rect x="80" y="20" width="50" height="15" fill={colors.grey} />
            <rect x="80" y="52" width="40" height="15" fill={colors.grey} />
            <rect x="80" y="85" width="50" height="15" fill={colors.grey} />

            {/* A (Triangle shape) */}
            <path d="M 160 20 L 135 100 H 155 L 160 80 L 165 100 H 185 Z" fill={colors.yellow} />

            {/* M */}
            <path d="M 195 100 V 20 L 215 60 L 235 20 V 100 H 225 V 40 L 215 70 L 205 40 V 100 Z" fill={colors.white} />

            {/* UP */}
            <text x="250" y="100" fontFamily="monospace" fontSize="80" fontWeight="bold" fill={colors.yellow} letterSpacing="-2">
                UP
            </text>
        </svg>
        <span className="text-xl font-bold tracking-widest text-white">STRUCTURAL</span>
    </div>
);
