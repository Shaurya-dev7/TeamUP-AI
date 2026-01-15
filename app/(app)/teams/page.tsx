"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Users, Sparkles, Plus, Inbox, Rocket, Zap, Globe, Shield, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TeamCardSkeleton } from "@/components/ui/skeletons";
import TeamCard from "@/components/teams/TeamCard";
import { checkProfileCompleteness } from "@/lib/profile/completeness";

// Demo teams data for browsing as fallback
const demoTeams = Array.from({ length: 15 }, (_, i) => {
  const teamNames = ["AI Innovators", "Web3 Wizards", "Cloud Crusaders", "Data Dragons", "Mobile Mavericks", "DevOps Dynamos", "Quantum Qrew", "Cyber Sentinels", "Code Commandos", "Blockchain Brigade", "ML Masters", "Full Stack Fury", "Backend Beasts", "Frontend Force", "UX Unicorns"];
  const teamGoals = ["AI/ML Hackathon", "Web3 DeFi Project", "Cloud Architecture", "Data Science", "Mobile App Dev", "DevOps Automation", "Quantum Computing", "Cybersecurity", "Open Source", "Blockchain DApps"];
  const rolesList = ["Frontend Dev", "Backend Dev", "ML Engineer", "DevOps", "Designer", "Data Scientist", "Mobile Dev", "QA Engineer"];
  const joinModes = ['open', 'request', 'closed'] as const;

  return {
    id: 100001 + i,
    name: teamNames[i % teamNames.length],
    goal: teamGoals[i % teamGoals.length],
    join_mode: joinModes[i % 3], // Cycles: open, request, closed
    max_members: 4 + (i % 4),
    member_count: 1 + (i % 3),
    roles_needed: [rolesList[i % rolesList.length], rolesList[(i + 3) % rolesList.length]],
    has_pending_request: false,
    is_private: joinModes[i % 3] === 'closed',
  };
});

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 300, damping: 24 }
  }
};

export default function TeamsPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'explore' | 'my-teams'>('explore');
  const [searchQuery, setSearchQuery] = useState("");
  const [teams, setTeams] = useState<any[]>(demoTeams);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        setUserId(uid);

        let token: string | undefined;
        if (uid) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", uid)
              .single();

            if (profile) {
              const check = checkProfileCompleteness(profile, { minimal: true });
              setIsProfileComplete(check.isComplete);
            }
          } catch (profileErr) {
            console.error("Error fetching profile:", profileErr);
          }

          // Get token for API calls
          token = data.session?.access_token;
          
          // My Teams (only for logged-in users) - use dedicated endpoint
          if (token) {
            try {
              const res = await fetch("/api/teams/mine", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const result = await res.json();
                if (result.teams) {
                  setMyTeams(result.teams);
                }
              }
            } catch (e) {
              console.error("Error fetching my teams:", e);
            }
          }
        }
        
        // Explore Teams (for all users, with or without auth)
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          const res = await fetch(`/api/teams?limit=50`, { headers });
          if (res.ok) {
            const result = await res.json();
            if (result.teams && result.teams.length > 0) {
              setTeams(result.teams);
            }
          }
        } catch (e) {
          console.error("Error fetching teams:", e);
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTeams = (activeTab === 'explore' ? teams : myTeams).filter((team) => {
    // For Explore, exclude my teams
    if (activeTab === 'explore' && myTeams.some(myTeam => myTeam.id === team.id)) return false;
    
    // For Explore, filter out closed teams if desired, or keep them to show status
    // if (activeTab === 'explore' && team.join_mode === "closed") return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      team.id.toString().includes(q) ||
      team.name.toLowerCase().includes(q) ||
      team.goal?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#050505] overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-yellow-400/10 to-orange-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-32 pt-20 sm:px-6 lg:px-8">
        
        {/* --- Hero Section --- */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse" />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-yellow-500/30 rotate-3">
              <Users className="h-10 w-10 text-white" />
            </div>
            {/* Floating decorative icons */}
            <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -right-8 -top-4 bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-lg"
            >
               <Zap className="h-5 w-5 text-yellow-500" />
            </motion.div>
            <motion.div 
               animate={{ y: [0, 8, 0] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -left-8 -bottom-2 bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-lg"
            >
               <Globe className="h-5 w-5 text-blue-500" />
            </motion.div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-4"
          >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Dream Team</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-neutral-500 max-w-2xl mx-auto"
          >
            Connect with talented developers, designers, and innovators. Build something extraordinary together.
          </motion.p>
        </div>

        {/* --- Profile Incomplete Gate --- */}
        <AnimatePresence>
          {!loading && !isProfileComplete && userId && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-12"
            >
              <div className="max-w-3xl mx-auto rounded-3xl border border-yellow-200/50 dark:border-yellow-900/30 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 p-8 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Shield className="w-32 h-32 text-yellow-500" />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                    <Shield className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Complete Your Profile to Join</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                      You need to set up your profile including name, age, and gender before you can join or create teams.
                    </p>
                    <Link
                      href="/create-profile"
                      className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-6 py-2.5 font-bold text-white shadow-lg shadow-yellow-500/25 hover:bg-yellow-600 hover:shadow-yellow-500/40 hover:-translate-y-0.5 transition-all"
                    >
                      Complete Profile <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Controls: Tabs & Search --- */}
        <div className="sticky top-20 z-40 mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-3 shadow-xl shadow-neutral-200/20 dark:shadow-none backdrop-blur-md border border-white/20 dark:border-white/5">
            {/* Tabs */}
            <div className="relative flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
              <motion.div 
                className="absolute top-1 bottom-1 rounded-xl bg-white dark:bg-neutral-700 shadow-sm"
                initial={false}
                animate={{ 
                  x: activeTab === 'explore' ? 0 : '100%', 
                  width: '50%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setActiveTab('explore')}
                className={`relative z-10 flex-1 px-6 py-2.5 text-sm font-bold transition-colors duration-200 ${activeTab === 'explore' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
              >
                Explore Teams
              </button>
              <button
                onClick={() => {
                   if (!userId) {
                      // Redirect logic could be here
                      return;
                   }
                   setActiveTab('my-teams');
                }}
                className={`relative z-10 flex-1 px-6 py-2.5 text-sm font-bold transition-colors duration-200 ${activeTab === 'my-teams' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'}`}
              >
                My Teams
              </button>
            </div>

            {/* Search & Action */}
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 group">
                 <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 group-focus-within:text-yellow-500 transition-colors" />
                 <input
                   type="text"
                   placeholder="Search teams..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-none py-3 pl-10 pr-4 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-yellow-500/20 placeholder:text-neutral-400 transition-all"
                 />
              </div>
              
              <Link
                href="/discover/teams/create"
                className="hidden sm:flex items-center gap-2 rounded-2xl bg-neutral-900 dark:bg-white px-5 py-3 text-sm font-bold text-white dark:text-neutral-900 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden lg:inline">Create Team</span>
                <span className="lg:hidden">Create</span>
              </Link>
            </div>
        </div>

        {/* --- Content Grid --- */}
        <AnimatePresence mode="wait">
           <motion.div
             key={activeTab + (loading ? 'loading' : 'loaded')}
             variants={containerVariants}
             initial="hidden"
             animate="visible"
             exit="exit"
             className="min-h-[400px]"
           >
             {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <TeamCardSkeleton key={i} />
                  ))}
                </div>
             ) : (activeTab === 'my-teams' ? myTeams : filteredTeams).length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                  {(activeTab === 'my-teams' ? myTeams : filteredTeams).map((team) => (
                    <motion.div key={team.id} variants={itemVariants}>
                      <TeamCard
                        {...team}
                        is_private={team.is_private || team.join_mode === 'closed'}
                        // Ensure we pass pending request status if available
                        has_pending_request={team.has_pending_request}
                        is_member={activeTab === 'my-teams'} 
                      />
                    </motion.div>
                  ))}
                </div>
             ) : (
                /* Empty States */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-200/50 to-transparent dark:from-neutral-700/50" />
                    {activeTab === 'explore' ? (
                        <Search className="h-10 w-10 text-neutral-400" />
                    ) : (
                        <Inbox className="h-10 w-10 text-neutral-400" />
                    )}
                  </div>
                  <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
                    {activeTab === 'my-teams' ? "No teams joined yet" : (searchQuery ? "No matches found" : "No teams available")}
                  </h3>
                  <p className="mb-8 max-w-sm text-neutral-500">
                    {activeTab === 'my-teams' 
                      ? "You aren't part of any teams. Explore to find one or create your own!"
                      : (searchQuery 
                          ? `We couldn't find any teams matching "${searchQuery}".` 
                          : "Be the first to create a team in this community!")}
                  </p>
                  
                  {activeTab === 'my-teams' && (
                    <Link
                      href="/discover/teams/create"
                      className="inline-flex items-center gap-2 rounded-2xl bg-yellow-500 px-8 py-4 font-bold text-white shadow-lg shadow-yellow-500/25 hover:bg-yellow-600 hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                      <Rocket className="h-5 w-5" />
                      Create Your First Team
                    </Link>
                  )}
                  {activeTab === 'explore' && searchQuery && (
                     <button 
                        onClick={() => setSearchQuery("")}
                        className="text-sm font-bold text-yellow-600 dark:text-yellow-500 hover:underline"
                     >
                        Clear search filters
                     </button>
                  )}
                </motion.div>
             )}
           </motion.div>
        </AnimatePresence>

        {/* Mobile Create FAB */}
        <div className="fixed bottom-24 right-6 sm:hidden z-50">
           <Link
             href="/discover/teams/create"
             className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xl shadow-neutral-900/20 active:scale-95 transition-transform"
           >
             <Plus className="h-6 w-6" />
           </Link>
        </div>

      </div>
    </div>
  );
}
