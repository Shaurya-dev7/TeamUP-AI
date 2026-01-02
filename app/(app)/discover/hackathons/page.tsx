"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronDown, Trophy, 
  ArrowLeft, Loader2
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useHackathons } from "@/hooks/useHackathons";
import HackathonCard from "@/components/hackathons/HackathonCard";
import { checkProfileCompleteness } from "@/lib/profile/completeness";
import { Skeleton } from "@/components/ui/Skeleton";

// --- Filters & Sort ---
const sortOptions = [
  { id: 'soon', label: 'Starting Soon' },
  { id: 'trending', label: 'Trending' },
  { id: 'prize', label: 'Highest Prizes' },
  { id: 'new', label: 'Newest Added' },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 50 } 
  }
};

export default function DiscoverHackathonsPage() {
  const supabase = createClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLiveOnly, setShowLiveOnly] = useState(false); // Can map to 'mode' or just client filter? Better to use hook
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("soon");
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Debounce Search
  useEffect(() => {
      const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
      return () => clearTimeout(handler);
  }, [searchQuery]);

  // Use Hook
  const { 
      data: hackathons, 
      loading, 
      isFetchingMore, 
      hasMore, 
      loadMore 
  } = useHackathons({
      sort: sortBy,
      search: debouncedSearch,
      // If 'showLiveOnly' is strictly "Active Now", we might need a specific filter. 
      // For now, let's keep it simple or map to a pseudo-filter if the API supported it.
      // The API has `mode` (online/in-person). 
      // "Live Only" implies date-based. 
      // Our API 'soon' sort puts current/upcoming first. 
      // Let's rely on standard sorts for now to maintain performance.
  });

  // User Check
  useEffect(() => {
    const init = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || null;
        setUserId(uid);

        if (uid) {
             const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
             if (profile) {
                 const check = checkProfileCompleteness(profile, { minimal: true });
                 setIsProfileComplete(check.isComplete);
             }
        }
    };
    init();
  }, []);

  // Infinite Scroll Observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
              loadMore();
          }
      });

      if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

      return () => observerRef.current?.disconnect();
  }, [loading, hasMore, isFetchingMore, loadMore]);


  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden bg-[#FAFAFA] dark:bg-[#050505]">
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* --- HERO SECTION --- */}
        <div className="space-y-8">
            <Link 
                href="/discover" 
                className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Discover
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-6 max-w-3xl relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold tracking-wide uppercase text-sm"
                    >
                        <Trophy className="w-4 h-4" /> Global Hackathon Season
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]"
                    >
                        Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">All Hackathons.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl"
                    >
                        Discover the hottest competitions, join live events, or prepare for what's coming next.
                    </motion.p>
                </div>
            </div>
        </div>

        {/* --- CONTROLS --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-lg shadow-neutral-200/20 dark:shadow-none"
        >
             {/* Search */}
             <div className="relative w-full md:w-auto md:min-w-[400px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                    type="text"
                    placeholder="Search by name, organizer, or mode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 ring-yellow-500/50 transition-all"
                />
            </div>

            {/* Other Filters */}
             <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {/* 
                  NOTE: "Live Only" logic is complex with pure API params unles API supports it. 
                  Users can view 'Starting Soon' which covers most needs. 
                  Removing simplified toggle to focus on accurate "Sort" behavior. 
                  Can be re-added if API gets 'status=live' param.
                */}

                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    >
                       <span className="hidden sm:inline">{sortOptions.find(o => o.id === sortBy)?.label}</span>
                       <ChevronDown className="w-3 h-3" />
                    </button>
                      <AnimatePresence>
                        {isSortOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                            >
                                {sortOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>

        {/* --- CONTENT AREA --- */}
        {loading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                 {[1,2,3,4,5,6,7,8].map(i => (
                     <Skeleton key={i} className="h-[380px] w-full rounded-3xl" />
                 ))}
             </div>
        ) : (
             <div className="space-y-8">
               <div className="flex items-center gap-2">
                   <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {searchQuery ? `Search Results` : sortOptions.find(o => o.id === sortBy)?.label}
                   </h2>
               </div>
               
               {hackathons.length > 0 ? (
                   <motion.div 
                       variants={containerVariants}
                       initial="hidden"
                       animate="visible"
                       className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                   >
                       {hackathons.map((hack, idx) => (
                           <motion.div key={`${hack.id}-${idx}`} variants={itemVariants} className="h-[420px]">
                               <HackathonCard 
                                    hackathon={hack} 
                                    userId={userId} 
                                    isProfileComplete={isProfileComplete}
                                />
                           </motion.div>
                       ))}
                   </motion.div>
               ) : (
                    <div className="text-center py-20 opacity-60">
                        <p className="text-lg">No Results Found</p>
                    </div>
               )}
               
               {/* Infinite Scroll Trigger */}
               {hasMore && (
                    <div ref={loadMoreRef} className="py-10 flex justify-center w-full">
                        {isFetchingMore && <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
                    </div>
               )}
            </div>
        )}

      </div>
    </div>
  );
}
