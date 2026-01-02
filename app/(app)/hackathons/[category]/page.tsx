"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Clock, Zap, Filter, ArrowLeft, Search, SlidersHorizontal, MapPin } from 'lucide-react';
import HackathonCard from '@/components/hackathons/HackathonCard';
import { HackathonEvent } from '@/lib/hackathons';
import { checkProfileCompleteness } from '@/lib/profile/completeness';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrendingHackathons, getLiveHackathons, getUpcomingHackathons, getAllHackathons } from '@/lib/hackathons';

// Sort Options
const SORTS = [
    { id: 'date_asc', label: 'Date (Soonest)' },
    { id: 'date_desc', label: 'Date (Latest)' },
    { id: 'prize_high', label: 'Prize (High to Low)' },
    { id: 'online_first', label: 'Online First' },
    { id: 'newest', label: 'Newest Added' },
];

export default function HackathonCategoryPage() {
    const params = useParams();
    const router = useRouter();
    // Safely handle params.category (it could be string or array or undefined)
    const rawCategory = params?.category;
    const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory as string;
    const supabase = createClient();

    const [hackathons, setHackathons] = useState<HackathonEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    
    // Filters
    const [sortBy, setSortBy] = useState('date_asc');
    const [filterMode, setFilterMode] = useState<string | null>(null); // 'online', 'offline'
    const [showFilters, setShowFilters] = useState(false); 
    // Additional Filters (State)
    const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
    const [filterHasPrize, setFilterHasPrize] = useState(false);

    // Initial Fetch (User & Events)
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // 1. User
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

            // 2. Events based on category
            let events: HackathonEvent[] = [];
            
            try {
                if (category === 'live') {
                    events = await getLiveHackathons(); // No limit
                } else if (category === 'upcoming') {
                    events = await getUpcomingHackathons(); // No limit
                } else if (category === 'trending') {
                    events = await getTrendingHackathons(); // No limit
                } else {
                    events = await getAllHackathons();
                }
                setHackathons(events);
            } catch (err) {
                console.error("Error fetching category:", err);
            }

            setLoading(false);
        };
        init();
    }, [category]);

    // Derived State: Sorting & Filtering
    const processedHackathons = React.useMemo(() => {
        let result = [...hackathons];

        // 1. Filter
        if (filterMode) {
             result = result.filter(h => h.mode?.toLowerCase().includes(filterMode));
        }
        if (filterHasPrize) {
            result = result.filter(h => h.cash_prize && h.cash_prize > 0);
        }
        if (filterDifficulty) {
             result = result.filter(h => h.difficulty?.toLowerCase() === filterDifficulty);
        }

        // 2. Sort
        result.sort((a, b) => {
            switch(sortBy) {
                case 'date_asc': 
                    return new Date(a.start_date || 0).getTime() - new Date(b.start_date || 0).getTime();
                case 'date_desc': 
                    return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
                case 'prize_high': 
                    return (b.cash_prize || 0) - (a.cash_prize || 0);
                case 'online_first':
                    // Online (1) vs Offline (0)
                    const aOnline = a.mode?.toLowerCase().includes('online') ? 1 : 0;
                    const bOnline = b.mode?.toLowerCase().includes('online') ? 1 : 0;
                    return bOnline - aOnline;
                case 'newest':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(); // Assuming created_at exists, else 0
                default: return 0;
            }
        });

        return result;
    }, [hackathons, filterMode, sortBy, filterHasPrize, filterDifficulty]);

    const getTitle = () => {
        switch(category) {
            case 'trending': return 'Trending Hackathons';
            case 'live': return 'Live Hackathons';
            case 'upcoming': return 'Upcoming Hackathons';
            default: return 'All Hackathons';
        }
    };

    const getIcon = () => {
        switch(category) {
            case 'trending': return Trophy;
            case 'live': return Zap;
            case 'upcoming': return Clock;
            default: return Trophy;
        }
    };

    const CategoryIcon = getIcon();

    return (
        <div className="min-h-screen bg-white dark:bg-black pt-20 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="space-y-4">
                    <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                             <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                                <CategoryIcon className="w-8 h-8 text-yellow-500" />
                                {getTitle()}
                             </h1>
                             <p className="mt-2 text-lg text-neutral-500 dark:text-neutral-400">
                                {processedHackathons.length} events found
                             </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                                >
                                    {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Filters Toggle (Simplified for Stage 3) */}
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                                    showFilters
                                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 dark:bg-black dark:text-neutral-300 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                }`}
                            >
                                <Filter className="w-4 h-4" /> Filters
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 flex flex-wrap gap-4 border-t border-b border-neutral-100 dark:border-neutral-800">
                                    {/* Mode Filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-neutral-500">Mode:</span>
                                        <div className="flex gap-1">
                                            {['all', 'online', 'offline'].map(m => (
                                                <button
                                                    key={m}
                                                    onClick={() => setFilterMode(m === 'all' ? null : m)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                                                        (filterMode === m || (!filterMode && m === 'all'))
                                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400"
                                                    }`}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Difficulty Filter */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-neutral-500">Diff:</span>
                                        <div className="flex gap-1">
                                            {['all', 'beginner', 'intermediate', 'advanced'].map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setFilterDifficulty(d === 'all' ? null : d)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                                                        (filterDifficulty === d || (!filterDifficulty && d === 'all'))
                                                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400"
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prize Filter */}
                                    <button
                                        onClick={() => setFilterHasPrize(!filterHasPrize)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                                            filterHasPrize
                                            ? "bg-green-600 text-white ring-2 ring-green-600 ring-offset-1"
                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400"
                                        }`}
                                    >
                                        <Trophy className="w-3 h-3" /> With Prize
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                         {['trending', 'live', 'upcoming', 'all'].map((cat) => (
                             <button
                                key={cat}
                                onClick={() => router.push(`/hackathons/${cat}`)}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                    (category === cat || (cat === 'all' && !['trending','live','upcoming'].includes(category)))
                                    ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                }`}
                             >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                             </button>
                         ))}
                    </div>
                </div>

                {/* Grid */}
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loading ? (
                         [1,2,3,4,5,6,7,8].map(i => (
                             <div key={i} className="h-[380px] bg-neutral-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
                         ))
                    ) : processedHackathons.length > 0 ? (
                        processedHackathons.map((hackathon) => (
                             <motion.div 
                                key={hackathon.id} 
                                layout
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="h-[400px]"
                             >
                                <HackathonCard 
                                    hackathon={hackathon as any}
                                    userId={userId}
                                    isProfileComplete={isProfileComplete}
                                />
                             </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-neutral-500">
                             <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                             <p className="text-lg font-medium">No hackathons found matching your criteria.</p>
                             <button onClick={() => { setFilterMode(null); setSortBy('date_asc'); }} className="mt-4 text-yellow-600 hover:underline">Reset filters</button>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}
