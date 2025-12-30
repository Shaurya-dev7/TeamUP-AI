"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageSquare, Search, Zap, Check } from "lucide-react";
import { MagneticText } from "@/components/ui/morphing-cursor";
import AppFooter from "@/components/AppFooter";
import AnnouncementTicker from "@/components/AnnouncementTicker";

// --- Components ---

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float-slow" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-float-medium" />
      </div>

      <div className="container relative z-10 px-4 mx-auto text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold tracking-wide text-yellow-700 uppercase bg-yellow-50 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50"
        >
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          The #1 Team Building Platform
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-6 text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-7xl"
        >
          Find your perfect <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-300 dark:to-yellow-500">teammate</span> in seconds.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-10 text-lg text-neutral-600 dark:text-neutral-400 sm:text-xl"
        >
          Stop searching blindly. TeamUp uses AI to match you with people who share your skills, interests, and passion.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/discover"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-neutral-950 transition-all bg-yellow-400 rounded-full hover:bg-yellow-300 hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
          >
            Start Discovering <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-neutral-900 transition-all bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 dark:bg-neutral-900 dark:text-white dark:border-neutral-800 dark:hover:bg-neutral-800 hover:scale-105 active:scale-95"
          >
            Create Profile
          </Link>
        </motion.div>
        
        {/* ENHANCED UI MOCKUP */}
        <motion.div
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.7, delay: 0.5 }} 
           className="relative mt-20 mx-auto max-w-5xl rounded-3xl border border-neutral-200 bg-white/40 p-2 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/40"
        >
             <div className="absolute inset-x-0 -bottom-1 h-32 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 to-transparent z-20 pointer-events-none" />
             
             <div className="aspect-[16/9] rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/50 overflow-hidden relative flex items-center justify-center">
                
                {/* Simulated App Background */}
                <div className="absolute inset-0 bg-grid-black dark:bg-grid-white opacity-5" />

                {/* Main Match Card */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6"
                >
                    <div className="flex items-center gap-4 mb-6">
                         <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                SD
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full" />
                         </div>
                         <div className="text-left">
                             <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Shaurya Deep</h3>
                             <p className="text-sm text-neutral-500">Full Stack Developer • 3rd Year</p>
                             <div className="flex gap-1 mt-1">
                                 {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-1 bg-yellow-400 rounded-full" />)}
                             </div>
                         </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                             <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Top Skills</div>
                             <div className="flex flex-wrap gap-2">
                                 {["React", "Next.js", "TypeScript", "Node.js"].map(s => (
                                     <span key={s} className="px-3 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs font-medium shadow-sm">
                                         {s}
                                     </span>
                                 ))}
                             </div>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Match Score</div>
                                <div className="text-2xl font-bold text-neutral-900 dark:text-white">98%</div>
                            </div>
                            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                        <button className="flex-1 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                            View Profile
                        </button>
                        <button className="flex-1 py-3 bg-yellow-400 text-neutral-950 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Chat
                        </button>
                    </div>
                </motion.div>

                 {/* Floating Success Toasts */}
                 <motion.div 
                   initial={{ opacity: 0, x: 50 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 1.5 }}
                   className="absolute top-10 right-10 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 flex items-center gap-3"
                 >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">🤝</div>
                    <div className="text-left">
                        <div className="text-xs font-bold dark:text-white">Mutual Connection</div>
                        <div className="text-[10px] text-neutral-500">You both know Rahul</div>
                    </div>
                 </motion.div>

                 <motion.div 
                   initial={{ opacity: 0, x: -50 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 2 }}
                   className="absolute bottom-10 left-10 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 flex items-center gap-3"
                 >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">🎓</div>
                    <div className="text-left">
                        <div className="text-xs font-bold dark:text-white">Campus Match</div>
                        <div className="text-[10px] text-neutral-500">Both from IIT Delhi</div>
                    </div>
                 </motion.div>
             </div>
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  return (
    <div className="w-full py-10 overflow-hidden bg-white dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800">
      <div 
        className="relative flex items-center gap-10 animate-shimmer w-max"
        style={{ animationDuration: "40s" }}
      >
        {/* Duplicated list for seamless loop */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center gap-16 px-4">
             {["MIT", "Stanford", "YCombinator", "Google", "Microsoft", "Amazon", "HackMIT"].map(logo => (
                 <span key={logo} className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest pointer-events-none select-none opacity-80 hover:opacity-100 transition-opacity">
                     {logo}
                 </span>
             ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BentoGrid() {
    return (
        <section className="py-24 container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 dark:text-white">Why <span className="text-yellow-500">TeamUp?</span></h2>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">We've reimagined how teams are formed. It's not just a directory; it's an intelligent engine.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Feature 1: Skill + Interest Matching */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="col-span-1 md:col-span-2 rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-8 border border-neutral-200 dark:border-neutral-800 hover:border-yellow-400/50 transition-all group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-50 group-hover:opacity-100" />
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                            <Zap className="w-6 h-6 text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 dark:text-white">Skill + Interest Matching</h3>
                        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-8">
                            Discover people who don't just have the skills you need, but share your vision. Our algorithm weights shared interests heavily to ensure team chemistry.
                        </p>
                        
                        {/* Visual for Skills */}
                        <div className="flex flex-wrap gap-2">
                             {["React", "Design", "Web-Development", "ART", "AI"].map((tag, i) => (
                                 <div key={tag} className={`px-3 py-1 rounded-full text-xs font-medium border ${i < 3 ? 'bg-yellow-400 text-neutral-950 border-yellow-400' : 'bg-white dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'}`}>
                                     {tag}
                                 </div>
                             ))}
                        </div>
                    </div>
                </motion.div>

                {/* Feature 2: Network Aware */}
                <motion.div 
                   whileHover={{ y: -5 }}
                   className="col-span-1 rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-8 hover:shadow-xl transition-all relative overflow-hidden"
                >
                     <div className="absolute inset-0 bg-grid-black dark:bg-grid-white opacity-[0.03]" />
                     <div className="relative z-10 h-full flex flex-col">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-6">
                            <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 dark:text-white">Network-Aware</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 flex-1">
                            Mutual connections and shared organizations boost match quality. Trust is built-in.
                        </p>
                        <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-500">
                                    U{i}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-white dark:border-neutral-900 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                                +5
                            </div>
                        </div>
                     </div>
                </motion.div>

                {/* Feature 3: Chat */}
                <motion.div 
                   whileHover={{ y: -5 }}
                   className="col-span-1 md:col-span-3 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-8 border border-neutral-800 hover:border-neutral-700 transition-all relative overflow-hidden"
                >
                     <div className="flex flex-col md:flex-row items-center gap-8">
                         <div className="flex-1">
                             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                                 <MessageSquare className="w-6 h-6 text-white" />
                             </div>
                             <h3 className="text-2xl font-bold mb-2">1:1 and Group Chat</h3>
                             <p className="text-neutral-400 max-w-lg">
                                 Start conversations instantly. Form groups, share ideas, and finalize your team roster without leaving the platform.
                             </p>
                         </div>
                         <div className="flex-1 w-full max-w-md">
                             <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-3">
                                 <div className="flex gap-3">
                                     <div className="w-8 h-8 rounded-full bg-yellow-400" />
                                     <div className="bg-white/10 rounded-2xl rounded-tl-none p-3 text-sm">
                                         Hey! Saw you're into Next.js too.
                                     </div>
                                 </div>
                                 <div className="flex gap-3 flex-row-reverse">
                                     <div className="w-8 h-8 rounded-full bg-blue-400" />
                                     <div className="bg-yellow-400 text-black rounded-2xl rounded-tr-none p-3 text-sm font-medium">
                                         Yeah! Let's team up for the hackathon?
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

function CTA() {
    return (
        <section className="py-24 px-4 bg-neutral-950 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/20 rounded-full blur-[120px]" />
            
            <div className="container mx-auto relative z-10 text-center">
                <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Ready to build the <span className="text-yellow-400">future?</span></h2>
                <p className="text-lg text-neutral-400 mb-10 max-w-2xl mx-auto">Join thousands of developers, designers, and creators finding their dream team on TeamUp today.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                     <Link href="/signup" className="px-8 py-4 bg-yellow-400 text-neutral-950 font-bold rounded-full hover:bg-yellow-300 transition-colors">
                        Get Started for Free
                     </Link>
                     <Link href="/discover" className="px-8 py-4 bg-neutral-800 text-white font-bold rounded-full hover:bg-neutral-700 transition-colors border border-neutral-700">
                        Explore Teams
                     </Link>
                </div>
                <div className="mt-12 flex justify-center gap-8 text-sm text-neutral-500">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" /> Free logic
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" /> No credit card
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" /> Instant access
                    </div>
                </div>
            </div>
        </section>
    )
}



export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 selection:bg-yellow-400/30">
        <AnnouncementTicker />
        <Hero />
        <Marquee />
        <BentoGrid />
        <CTA />
        <AppFooter />
    </div>
  );
}
