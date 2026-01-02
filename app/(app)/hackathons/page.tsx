"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHackathons } from "@/hooks/useHackathons";
import HackathonList from "@/components/hackathons/HackathonList";
import HackathonSection from "@/components/hackathons/HackathonSection";
import { Calendar, Search, Filter, Trophy } from "lucide-react";
import { checkProfileCompleteness } from "@/lib/profile/completeness";

export default function HackathonsPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // Debounced/Triggered search

  // 1. Fetch User
  useEffect(() => {
    const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        setUserId(uid);
        
        if (uid) {
           const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
           if (profile) {
               const check = checkProfileCompleteness(profile, { minimal: true });
               setIsProfileComplete(check.isComplete);
           }
        }
    };
    fetchSession();
  }, []);

  // 2. Fetch Live/Upcoming (Top Section)
  // We use SWR hook but with limit 4 and sort soon
  const { hackathons: liveHackathons, isLoading: loadingLive } = useHackathons({ 
    sort: 'soon', 
    limit: 4,
    // Add custom filter for 'start_date >= now'? API handles 'soon' via simple sort.
    // Ideally we want to highlight 'Living' ones. 
  });

  // 3. Fetch All (Bottom Section) - Pagination
  const { hackathons: allHackathons, pagination, isLoading: loadingAll } = useHackathons({
    page,
    limit: 12,
    sort: 'soon', // or 'new', 'trending'
    search: activeSearch
  });

  // Accumulate hackathons for infinite scroll feel?
  // SWR revalidates the key. To do "Load More" appending, we need useSWRInfinite or manual accumulation.
  // For simplicity and stability, let's use standard pagination (Next/Prev) OR "Load More" with accumulation state?
  // "Load More" logic with useSWR usually requires `useSWRInfinite`.
  // Given time constraints, I'll stick to a simpler "Load Next Page" button which *replaces* content or use a manual accumulation list.
  // Actually, standard pagination (replacing content) is safer and faster to implement robustly. 
  // "Infinite scroll" requested. 
  // Let's implement a simple manual accumulation:
  const [accumulatedHackathons, setAccumulatedHackathons] = useState<any[]>([]);
  
  // NOTE: This simple accumulation is tricky with SWR changes. 
  // Easier: Just use pagination UI "Load More" that increments page limit? No, that fetches way too much.
  // Correct way: useSWRInfinite.
  // I will just use standard pagination (Load More simply fetches next page and APPENDS).
  // I need to watch `allHackathons` and append them when page changes? 
  // No, `useHackathons` changes `hackathons` when `page` changes.
  
  // Let's just use a simple list that we append to manually:
  // But wait, using useSWR for pagination means every page change triggers a fetch.
  // If I want "Infinite Scroll", I should append.
  
  // Let's go with: Single hook fetching 'limit * page' items? 
  // No, that's bad for perf.
  // I will use SWRInfinite pattern? 
  // Or just use the `limit` param to fetch more? limit=12, limit=24... 
  // This is simplest "Load More" but re-fetches start. 
  // "No loading all hackathons at once".
  // "Initial page load must fetch minimal data".
  // So limit=12 -> Load More -> limit=24? 
  // Yes, this is "cache-friendly" enough if backend is fast.
  // Limit max 30 in API though.
  // Ah, API has max limit 30. So I CANNOT use expanding limit strategy beyond 30.
  // I MUST use strict pagination (page 1, page 2).
  // So I'll just keep a local state `allHackathonsList` and append.
  
  useEffect(() => {
      if (allHackathons && allHackathons.length > 0) {
          if (page === 1) {
              setAccumulatedHackathons(allHackathons);
          } else {
              // Append unique
               setAccumulatedHackathons(prev => {
                   const newIds = new Set(allHackathons.map(h => h.id));
                   // Filter out existing (though minimal risk if pages are distinct)
                   const uniqueNew = allHackathons.filter(h => !prev.some(p => p.id === h.id));
                   return [...prev, ...uniqueNew];
               });
          }
      }
  }, [allHackathons, page]); // Only when these change

  // Reset on search
  useEffect(() => {
     setPage(1);
     setAccumulatedHackathons([]);
  }, [activeSearch]);


  return (
    <div className="min-h-screen bg-white dark:bg-black pb-20 pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="space-y-4">
             <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
                Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">Hackathons</span>
             </h1>
             <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
                Find your next challenge. Compete globally, win prizes, and build the future.
             </p>

             {/* Search Bar */}
             <div className="relative max-w-lg mt-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search hackathons..."
                    className="block w-full pl-10 pr-3 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl leading-5 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(search)}
                    onBlur={() => setActiveSearch(search)}
                />
             </div>
        </div>

        {/* Live / Upcoming Section (Only if no search) */}
        {!activeSearch && (
            <div className="space-y-6">
                <HackathonSection 
                    title="Live & Upcoming"
                    icon={Calendar}
                    subtitle="Events happening soon. Don't miss out!"
                    category="upcoming" // linking to self mainly?
                    hackathons={liveHackathons || []}
                    userId={userId}
                    isProfileComplete={isProfileComplete}
                    loading={loadingLive}
                />
            </div>
        )}

        {/* All Hackathons */}
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {activeSearch ? `Results for "${activeSearch}"` : "All Hackathons"}
                </h2>
            </div>
            
            <HackathonList 
                hackathons={accumulatedHackathons}
                loading={loadingAll}
                hasMore={pagination.hasMore}
                onLoadMore={() => setPage(p => p + 1)}
                userId={userId}
                isProfileComplete={isProfileComplete}
            />
        </div>

      </div>
    </div>
  );
}
