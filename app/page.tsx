"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageSquare, Search, Zap, Check, Sparkles, Globe, Shield } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import AnnouncementTicker from "@/components/AnnouncementTicker";

// --- Hooks for Tilt Effect ---
function useTilt(ref: React.RefObject<HTMLElement | null>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { x, y, handleMouseMove, handleMouseLeave };
}

// --- Background Grid Component ---
function PremiumBackgroundGrid() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Base Dot Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            
             {/* Animated Grid - Made semi-transparent for glassy feel */}
            <div className="absolute inset-0 h-full w-full bg-neutral-50/50 dark:bg-neutral-950/50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            
            {/* Glow / Spotlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-yellow-400/10 via-transparent to-transparent blur-3xl" />
        </div>
    );
}

// ... (Hero, TiltCard, FloatingBadge, Marquee components remain unchanged) ...

function CTA() {
    return (
        <section className="py-20 md:py-32 px-4 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white overflow-hidden relative border-t border-neutral-200 dark:border-neutral-800">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(#00000033_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px]" />
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[150px]" 
            />
            
            <div className="container mx-auto relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 tracking-tight">Ready to build the <span className="text-yellow-500 dark:text-yellow-400">future?</span></h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of developers, designers, and creators finding their dream team on TeamUp today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                     <Link href="/signup" className="px-6 py-4 sm:px-10 sm:py-5 bg-yellow-400 text-neutral-950 text-base sm:text-lg font-bold rounded-full hover:bg-yellow-300 transition-colors shadow-xl shadow-yellow-900/20 hover:scale-105 active:scale-95">
                        Get Started for Free
                     </Link>
                     <Link href="/discover" className="px-6 py-4 sm:px-10 sm:py-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-base sm:text-lg font-bold rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-800 hover:scale-105 active:scale-95">
                        Explore Teams
                     </Link>
                </div>
                <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-neutral-500 font-medium">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Free logic
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Instant chat access
                    </div>
                </div>
            </div>
        </section>
    )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent selection:bg-yellow-400/30">
        <AnnouncementTicker />
        <Hero />
        <Marquee />
        <BentoGrid />
        <CTA />
        <AppFooter />
    </div>
  );
}


// --- Components ---

import HeroCarousel from "@/components/HeroCarousel";

function Hero() {
  const targetRef = useRef(null);
  
  return (
    <section ref={targetRef} className="relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-32">
      <PremiumBackgroundGrid />
      
      {/* Background Orbs - Stabilized */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <motion.div 
            animate={{ 
                x: [0, 30, 0],
                y: [0, 20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-400/10 rounded-full blur-[100px]" 
        />
        <motion.div 
            animate={{ 
                x: [0, -30, 0],
                y: [0, -20, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[100px]" 
        />
      </div>

      <div className="container relative z-10 px-4 mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold tracking-wide text-yellow-700 uppercase bg-yellow-50/80 backdrop-blur-sm rounded-full dark:bg-yellow-900/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/30 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
          </span>
          The #1 Team Building Platform
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="max-w-5xl mx-auto mb-6 text-4xl sm:text-5xl lg:text-8xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.1]"
        >
          Find your perfect <br className="hidden sm:block"/>
          <span className="relative inline-block">
             <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 dark:from-yellow-300 dark:via-orange-300 dark:to-yellow-400 animate-gradient-x">teammate</span>
             {/* Simplified underline animation to avoid layout shifts */}
             <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "circOut" }}
                className="absolute bottom-2 left-0 w-full h-4 bg-yellow-200/50 dark:bg-yellow-900/30 -z-10 -rotate-2 rounded-sm origin-left" 
             />
          </span>{" "}
          in seconds.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto mb-10 text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl leading-relaxed"
        >
          Stop searching blindly. TeamUp uses AI to match you with people who share your skills, interests, and passion. Build your dream team today.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/discover"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-neutral-950 transition-all bg-yellow-400 rounded-full hover:bg-yellow-300 hover:scale-105 active:scale-95 shadow-xl shadow-yellow-400/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
                Start Discovering <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:animate-shimmer" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-neutral-900 transition-all bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:bg-neutral-800 hover:scale-105 active:scale-95"
          >
            Create Profile
          </Link>
        </motion.div>
        
        {/* CAROUSEL SECTION */}
        <motion.div
           initial={{ opacity: 0, y: 50, rotateX: 10 }}
           animate={{ opacity: 1, y: 0, rotateX: 0 }}
           transition={{ duration: 1, delay: 0.4, type: "spring", stiffness: 60 }} 
           className="relative mt-20 mx-auto w-full px-2 sm:px-0"
        >
            <HeroCarousel />
        </motion.div>
      </div>
    </section>
  );
}

function TiltCard() {
    const ref = useRef<HTMLDivElement>(null);
    const { x, y, handleMouseMove, handleMouseLeave } = useTilt(ref);
    const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]); // Reduced tilt for stability
    const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);

    return (
        <motion.div 
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
                rotateX, 
                rotateY,
                transformStyle: "preserve-3d" 
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 cursor-default will-change-transform"
        >
            <div style={{ transform: "translateZ(20px)" }} className="flex items-center gap-4 mb-6">
                 <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        SD
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full animate-pulse" />
                 </div>
                 <div className="text-left">
                     <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Shaurya Deep</h3>
                     <p className="text-sm text-neutral-500">Full Stack Developer • 3rd Year</p>
                     <div className="flex gap-1 mt-1">
                         {[1,2,3,4,5].map(i => <div key={i} className="w-6 h-1.5 bg-yellow-400 rounded-full opacity-80" />)}
                     </div>
                 </div>
            </div>

            <div style={{ transform: "translateZ(10px)" }} className="space-y-4">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50">
                     <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Top Skills</div>
                     <div className="flex flex-wrap gap-2">
                         {["React", "Next.js", "TypeScript", "Node.js"].map(s => (
                             <span key={s} className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs font-semibold shadow-sm text-neutral-700 dark:text-neutral-300">
                                 {s}
                             </span>
                         ))}
                     </div>
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between border border-neutral-100 dark:border-neutral-700/50">
                    <div>
                        <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Match Score</div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">98%</div>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-600 dark:text-green-400 fill-green-600/20" />
                    </div>
                </div>
            </div>
            
            <div style={{ transform: "translateZ(30px)" }} className="mt-6 flex gap-3">
                <button className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg">
                    View Profile
                </button>
                <button className="flex-1 py-3 bg-yellow-400 text-neutral-950 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20">
                    <MessageSquare className="w-4 h-4 fill-current" /> Chat
                </button>
            </div>
        </motion.div>
    )
}

function FloatingBadge({ delay, x, y, icon, title, subtitle, color }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, x: x + (x > 0 ? 50 : -50) }}
            animate={{ opacity: 1, x: x }}
            transition={{ delay, type: "spring" }}
            className={`absolute top-1/2 left-1/2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-700 flex items-center gap-3 z-0 -translate-y-1/2`}
            style={{ marginTop: y, marginLeft: x > 0 ? -100 : 0 }} 
        >
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center text-xl`}>{icon}</div>
        <div className="text-left w-max">
            <div className="text-xs font-bold dark:text-white">{title}</div>
            <div className="text-[10px] text-neutral-500">{subtitle}</div>
        </div>
        </motion.div>
    )
}

function Marquee() {
  return (
    <div className="w-full py-10 overflow-hidden bg-white dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
      <motion.div 
        className="flex items-center gap-20 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
            duration: 20, 
            ease: "linear", 
            repeat: Infinity 
        }}
        // Pause on hover
        whileHover={{ animationPlayState: "paused" }} 
      >
        {/* Duplicated list for seamless loop */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-20 px-4">
             {["MIT", "Stanford", "YCombinator", "Google", "Microsoft", "Amazon", "HackMIT", "TechCrunch"].map((logo, idx) => (
                 <span key={`${logo}-${idx}`} className="text-3xl font-black text-transparent bg-clip-text bg-neutral-300 dark:bg-neutral-700 uppercase tracking-widest hover:text-neutral-900 dark:hover:text-white transition-colors cursor-default whitespace-nowrap">
                     {logo}
                 </span>
             ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function BentoGrid() {
    return (
        <section className="py-32 container mx-auto px-4 relative z-10">
            <div className="text-center mb-20 max-w-3xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex justify-center mb-4"
                >
                    <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">
                        Features
                    </span>
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6 dark:text-white"
                >
                    Why <span className="text-yellow-500 underline decoration-wavy decoration-yellow-300 underline-offset-4">TeamUp?</span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed"
                >
                    We've reimagined how teams are formed. It's not just a directory; it's an intelligent engine designed for connection.
                </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Feature 1: Skill + Interest Matching */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="col-span-1 md:col-span-2 rounded-[2rem] bg-neutral-50 dark:bg-neutral-900 p-10 border border-neutral-200 dark:border-neutral-800 hover:border-yellow-400/50 transition-all group relative overflow-hidden shadow-sm"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px] -mr-20 -mt-20 transition-opacity opacity-50 group-hover:opacity-100" />
                    
                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-8 shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4 dark:text-white">Skill + Interest Matching</h3>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg mb-10 leading-relaxed">
                            Discover people who don't just have the skills you need, but share your vision. Our algorithm weights shared interests heavily to ensure team chemistry.
                        </p>
                        
                        {/* Visual for Skills */}
                        <div className="flex flex-wrap gap-3">
                             {["React", "Design", "Web-Development", "ART", "AI", "Startup", "Finance"].map((tag, i) => (
                                 <motion.div 
                                    key={tag} 
                                    whileHover={{ scale: 1.05 }}
                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${i < 3 ? 'bg-yellow-400 text-neutral-950 border-yellow-400 shadow-lg shadow-yellow-400/20' : 'bg-white dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'}`}
                                 >
                                     {tag}
                                 </motion.div>
                             ))}
                        </div>
                    </div>
                </motion.div>

                {/* Feature 2: Network Aware */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-50px" }}
                   transition={{ delay: 0.4 }}
                   whileHover={{ y: -5 }}
                   className="col-span-1 rounded-[2rem] bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-10 hover:shadow-2xl transition-all relative overflow-hidden group"
                >
                     <div className="absolute inset-0 bg-grid-black/[0.03] dark:bg-grid-white/[0.03] mask-image-gradient-b" />
                     <div className="relative z-10 h-full flex flex-col">
                        <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/20 transition-colors">
                            <Globe className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4 dark:text-white">Network-Aware</h3>
                        <p className="text-base text-neutral-600 dark:text-neutral-400 mb-8 flex-1 leading-relaxed">
                            Mutual connections and shared organizations boost match quality. Trust is built-in.
                        </p>
                        <div className="flex -space-x-4 pl-2">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500 shadow-md">
                                    Include
                                </div>
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-white dark:border-neutral-950 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500 shadow-md">
                                +500
                            </div>
                        </div>
                     </div>
                </motion.div>

                {/* Feature 3: Chat */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true, margin: "-50px" }}
                   transition={{ delay: 0.5 }}
                   whileHover={{ y: -5 }}
                   className="col-span-1 md:col-span-3 rounded-[2rem] bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-10 border border-neutral-800 hover:border-neutral-700 transition-all relative overflow-hidden shadow-2xl"
                >
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
                     
                     <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                         <div className="flex-1">
                             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm shadow-inner bond-ring">
                                 <MessageSquare className="w-8 h-8 text-white" />
                             </div>
                             <h3 className="text-3xl font-bold mb-4">Real-time Collaboration</h3>
                             <p className="text-neutral-400 max-w-lg text-lg leading-relaxed">
                                 Start conversations instantly. Form groups, share ideas, and finalize your team roster without leaving the platform.
                             </p>
                         </div>
                         <div className="flex-1 w-full max-w-xl">
                             <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl">
                                 <div className="flex gap-4">
                                     <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white/20" />
                                     <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed">
                                         Hey! Saw you're into Next.js too. What are you building?
                                     </div>
                                 </div>
                                 <div className="flex gap-4 flex-row-reverse">
                                     <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white/20" />
                                     <div className="bg-yellow-400 text-black rounded-2xl rounded-tr-none p-4 text-sm font-bold shadow-lg shadow-yellow-400/10">
                                         I'm working on an AI travel planner! Need a frontend wizard 🧙‍♂️
                                     </div>
                                 </div>
                                 <div className="flex gap-4">
                                     <div className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-white/20" />
                                     <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed flex items-center gap-2">
                                         <span>Say less. I'm in!</span> <span className="text-xl">🚀</span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                </motion.div>
            </div>
        </section>
    )
}

