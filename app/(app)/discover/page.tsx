"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, DollarSign, Clock, ArrowRight, Shield, Code, Brain, Cloud, Briefcase, Trophy, Calendar, Filter, UserPlus, Check, ChevronDown, Users, Sparkles, Zap, Loader2, ExternalLink, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";
import HackathonCard from "@/components/hackathons/HackathonCard";
import { HackathonEvent } from "@/lib/hackathons";
import HackathonSection from "@/components/hackathons/HackathonSection";
import { checkProfileCompleteness } from "@/lib/profile/completeness";

// Import Server Actions for Courses
import { getTrendingCourses, getNewCourses, trackCourseClick } from "./courses/actions";
// Import Server Actions for Hackathons
import { getTrendingHackathons, getLiveHackathons, getUpcomingHackathons, getAllHackathons } from "@/lib/hackathons";

// --- Types ---
type Profile = {
  id: string;
  name: string | null;
  username: string;
  skills: string | null;
  college: string | null;
  location: string | null;
  avatar_url?: string;
  matchPercentage?: number;
  interests?: string | null;
  age?: number | null;
  gender?: string | null;
};

// --- Internships Data ---
const internships = [
  {
    id: 1,
    role: "Frontend Developer Intern",
    company: "Vercel",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=V&backgroundColor=000000&textColor=ffffff",
    location: "Remote",
    stipend: "$1,500/month",
    duration: "6 Months",
    tags: ["React", "Next.js", "Edge"],
    color: "from-black/5 to-neutral-500/5",
    border: "group-hover:border-black/50 dark:group-hover:border-white/50",
    text_color: "text-black dark:text-white",
  },
  {
    id: 2,
    role: "AI Research Intern",
    company: "OpenAI",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=OA&backgroundColor=10a37f&textColor=ffffff",
    location: "San Francisco, CA",
    stipend: "$3,200/month",
    duration: "3 Months",
    tags: ["PyTorch", "LLMs", "CUDA"],
    color: "from-emerald-500/20 to-teal-500/20",
    border: "group-hover:border-emerald-500/50",
    text_color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: 3,
    role: "Software Engineer Intern",
    company: "Spotify",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=SP&backgroundColor=1db954&textColor=ffffff",
    location: "New York, NY",
    stipend: "$2,800/month",
    duration: "Summer 2024",
    tags: ["Backend", "Java", "GCP"],
    color: "from-green-500/20 to-emerald-500/20",
    border: "group-hover:border-green-500/50",
    text_color: "text-green-600 dark:text-green-400",
  },
  {
    id: 4,
    role: "Product Design Intern",
    company: "Airbnb",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=AB&backgroundColor=ff5a5f&textColor=ffffff",
    location: "Remote",
    stipend: "$2,400/month",
    duration: "4 Months",
    tags: ["Figma", "Design Systems"],
    color: "from-rose-500/20 to-pink-500/20",
    border: "group-hover:border-rose-500/50",
    text_color: "text-rose-600 dark:text-rose-400",
  },
  {
    id: 5,
    role: "Cloud DevOps Intern",
    company: "Amazon Web Services",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=AWS&backgroundColor=ff9900&textColor=ffffff",
    location: "Seattle, WA",
    stipend: "$3,000/month",
    duration: "5 Months",
    tags: ["AWS", "Kubernetes", "Go"],
    color: "from-orange-500/20 to-amber-500/20",
    border: "group-hover:border-orange-500/50",
    text_color: "text-orange-600 dark:text-orange-400",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Demo Teams Data (50 teams)
// join_mode: 'open' (anyone can join), 'request' (apply to join), 'closed' (invite only)
const teamNames = ["AI Innovators", "Web3 Wizards", "Cloud Crusaders", "Data Dragons", "Mobile Mavericks", "DevOps Dynamos", "Quantum Qrew", "Cyber Sentinels", "Code Commandos", "Blockchain Brigade", "ML Masters", "Full Stack Fury", "Backend Beasts", "Frontend Force", "UX Unicorns", "API Architects", "Script Squad", "Bug Busters", "Tech Titans", "Innovation Inc", "Pixel Perfect", "Logic Lords", "Byte Battalion", "Neural Nomads", "Agile Avengers", "Sprint Stars", "Deploy Demons", "Git Guardians", "Lambda Legion", "Server Samurai", "Cloud Kings", "Data Dreamers", "Code Catalysts", "Binary Bosses", "Stack Surfers", "Hash Heroes", "Query Queens", "Merge Masters", "Commit Crew", "Branch Bandits", "Pull Pirates", "Push Pioneers", "Build Breakers", "Test Titans", "Debug Divas", "Lint Lords", "Parse Patrol", "Compile Clan", "Runtime Rebels", "Exception Elite"];
const teamGoals = ["AI/ML Hackathon", "Web3 DeFi Project", "Cloud Architecture", "Data Science", "Mobile App Dev", "DevOps Automation", "Quantum Computing", "Cybersecurity", "Open Source", "Blockchain DApps", "Deep Learning", "Full Stack App", "API Development", "UI/UX Design", "IoT Solutions", "Game Development", "AR/VR Project", "Fintech Solution", "EdTech Platform", "HealthTech App"];
const rolesList = ["Frontend Dev", "Backend Dev", "ML Engineer", "DevOps", "Designer", "Data Scientist", "Mobile Dev", "QA Engineer", "Product Manager", "Blockchain Dev"];
const joinModes = ['open', 'request', 'closed'] as const;

const demoTeams = Array.from({ length: 50 }, (_, i) => ({
  id: 100001 + i,
  name: teamNames[i % teamNames.length],
  goal: teamGoals[i % teamGoals.length],
  join_mode: joinModes[i % 3], // Cycles: open, request, closed
  max_members: 4 + (i % 4),
  member_count: 1 + (i % 3),
  roles_needed: [rolesList[i % rolesList.length], rolesList[(i + 3) % rolesList.length]],
  leader: {
    username: `leader${i + 1}`,
    name: `Team Leader ${i + 1}`,
  }
}));

// --- Added Icons for Filter Options ---
const filterOptions = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'people', label: 'People', icon: Users },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'hackathons', label: 'Hackathons', icon: Trophy },
  { id: 'internships', label: 'Internships', icon: Briefcase },
] as const;

export default function DiscoverPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<typeof filterOptions[number]['id']>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [realPeople, setRealPeople] = useState<Profile[]>([]);
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([]); // Restored for search
  const [trendingHackathons, setTrendingHackathons] = useState<HackathonEvent[]>([]);
  const [liveHackathons, setLiveHackathons] = useState<HackathonEvent[]>([]);
  const [upcomingHackathons, setUpcomingHackathons] = useState<HackathonEvent[]>([]);
  const [followedUsernames, setFollowedUsernames] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blockedUsernames, setBlockedUsernames] = useState<Set<string>>(new Set());
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // --- 1. Fetch User Session & Profile Completeness ---
  useEffect(() => {
    const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        setUserId(uid);
        
        if (uid) {
          // Get current user's details
          const { data: profile } = await supabase
            .from('profiles')
            .select('*') // Fetch all for completeness check
            .eq('id', uid)
            .single();
            
          if (profile) {
            setCurrentUsername((profile as any).username);
            // Check completeness using minimal logic (Name, Username, Age, Gender) per user request for Hackathon Apply
            const check = checkProfileCompleteness(profile, { minimal: true }); 
            setIsProfileComplete(check.isComplete);
          }
        }
    };
    fetchSession();
  }, []);

  // --- 2. Fetch Data (Profiles, Follows, Hackathons) ---
  useEffect(() => {
    const fetchHackathons = async () => {
        try {
            // Updated to use Server Actions

            // Search Data
            const allDocs = await getAllHackathons();
            setHackathons(allDocs);

            // Curated Sections
            console.log("Fetching trending hackathons...");
            const trending = await getTrendingHackathons(6); // Trending limit 6
            console.log("Trending hackathons result:", trending);
            setTrendingHackathons(trending);
            
            // Note: Live and Upcoming are now on /discover/hackathons
            setLiveHackathons([]); 
            setUpcomingHackathons([]);
        } catch (e) {
            console.error("Hackathon fetch error:", e);
        } finally {
            // Ensure loading is set to false after hackathon fetch
            setLoading(false);
        }
    };
    fetchHackathons();

    if (!userId) {
        setLoading(false); // If no user, we still show hackathons, so stop loading
        return;
    }

    const fetchData = async () => {
        setLoading(true);
        if (searchQuery.trim()) {
            // Server-side search for profiles
            let query = supabase
                .from('profiles')
                .select('id, name, username, skills, college, location')
                .neq('id', userId);

            const cleanQuery = searchQuery.trim().toLowerCase();
            query = query.or(`username.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%,skills.ilike.%${cleanQuery}%`);
            query = query.limit(50);
            
            const { data: profilesData } = await query;
            if (profilesData) {
                setRealPeople(profilesData);
            }
        } else {
             // Recommendation Logic
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                
                if (token) {
                    const res = await fetch('/api/recommendations?limit=20', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (data.recommendations) {
                            setRealPeople(data.recommendations);
                        }
                    }
                }
            } catch (e) {
               console.error("Failed to fetch recommendations", e);
            }
        }

        // Fetch followed usernames
        if (!searchQuery && currentUsername) {
            const { data: followsData } = await supabase
                .from('follows')
                .select('following')
                .eq('follower', currentUsername);

            if (followsData) {
                setFollowedUsernames(new Set((followsData as any[]).map(f => f.following)));
            }
        }

        setLoading(false);
    };

    // Debounce
    const timeout = setTimeout(() => {
        fetchData();
    }, searchQuery ? 500 : 0);

    return () => clearTimeout(timeout);
  }, [userId, searchQuery, currentUsername]);

  // --- 3. Block Logic ---
  useEffect(() => {
    if (!currentUsername) return;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        // Fetch all users I've blocked
        // @ts-ignore
        const { data: myBlocks } = await supabase
          .from('blocks')
          .select('blocked_username')
          .eq('blocker_username', currentUsername);

        // Fetch all users who've blocked me
        // @ts-ignore
        const { data: blockedByOthers } = await supabase
          .from('blocks')
          .select('blocker_username')
          .eq('blocked_username', currentUsername);

        const blockedSet = new Set<string>();
        
        (myBlocks as any[] || []).forEach((b: any) => {
          if (b.blocked_username) blockedSet.add(b.blocked_username.toLowerCase());
        });
        
        (blockedByOthers as any[] || []).forEach((b: any) => {
          if (b.blocker_username) blockedSet.add(b.blocker_username.toLowerCase());
        });

        setBlockedUsernames(blockedSet);
      } catch (e) {
        console.error('Error fetching blocks:', e);
      }
    })();
  }, [currentUsername, supabase]);

  // --- 4. Follow Logic ---
  const toggleFollow = async (targetUsername: string) => {
    if (!userId || !currentUsername) return;

    // Optimistic Update
    const isFollowing = followedUsernames.has(targetUsername);
    const newFollowedUsernames = new Set(followedUsernames);
    if (isFollowing) {
        newFollowedUsernames.delete(targetUsername);
    } else {
        newFollowedUsernames.add(targetUsername);
    }
    setFollowedUsernames(newFollowedUsernames);

    // API Call
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("No token");

        const method = isFollowing ? 'DELETE' : 'POST';
        const res = await fetch('/api/follow', {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ following_username: targetUsername })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Action failed");
        }
        
        toast.success(isFollowing ? "Unfollowed successfully" : "Followed successfully");
    } catch (error: any) {
        console.error("Follow error:", error);
        toast.error(error.message || "Failed to update follow status");
        // Revert
        setFollowedUsernames(followedUsernames);
    }
  };

  // --- 5. Course Click Logic --- (REMOVED)

  // --- 6. Filtering Logic ---
  const filteredPeople = realPeople.filter(person => 
    !blockedUsernames.has(person.username.toLowerCase())
  );

  const filteredInternships = internships.filter(i => 
    (filter === 'all' || filter === 'internships') &&
    (i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredHackathons = hackathons.filter(h => 
    (filter === 'all' || filter === 'hackathons') &&
    (h.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.mode?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasResults = filteredPeople.length > 0 || filteredInternships.length > 0 || filteredHackathons.length > 0;
  
  const currentFilter = filterOptions.find(f => f.id === filter) || filterOptions[0];
  const FilterIcon = currentFilter.icon;

  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden">
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* --- HERO SECTION --- */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-6xl">
            Discover your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">Future Path</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            Connect with like-minded professionals, find your dream internship, or master a new skill today.
          </p>
          
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.5 }}
             className="relative max-w-2xl mx-auto group z-30"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50 group-hover:opacity-80"></div>
            
            <div className="relative flex items-center bg-white dark:bg-neutral-900/80 backdrop-blur-xl border border-neutral-200 dark:border-white/10 p-2 rounded-full shadow-2xl transition-all">
                
                {/* Search Icon */}
                <div className="pl-4 pr-3 text-neutral-400">
                    <Search className="h-5 w-5" />
                </div>

                {/* Input Field */}
                <input 
                  type="text" 
                  placeholder={`Search ${filter === 'all' ? 'everything' : filter}...`} 
                  className="flex-1 bg-transparent outline-none text-neutral-900 dark:text-white placeholder:text-neutral-500 text-base py-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Custom Filter Dropdown */}
                <div className="relative px-2">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <FilterIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{currentFilter.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-full right-0 mt-3 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden py-2 z-50 origin-top-right"
                            >
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setFilter(option.id);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                                            filter === option.id 
                                            ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' 
                                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        }`}
                                    >
                                        <option.icon className={`w-4 h-4 ${filter === option.id ? 'text-yellow-500' : ''}`} />
                                        {option.label}
                                        {filter === option.id && <Check className="w-3 h-3 ml-auto text-yellow-500" />}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                 <button className="hidden sm:block rounded-full bg-neutral-900 px-8 py-3.5 font-bold text-white transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-neutral-950 shadow-lg hover:shadow-xl ml-2">
                    Search
                </button>
            </div>
          </motion.div>
        </div>

        {/* No Results Empty State */}
        {searchQuery && !hasResults && !loading && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No results found</h3>
                <p className="text-neutral-500 max-w-sm">
                    We couldn't find anything matching "{searchQuery}" in {filter === 'all' ? 'any category' : filter}. Try adjusting your search or filters.
                </p>
                <button 
                    onClick={() => { setSearchQuery(""); setFilter("all"); }}
                    className="mt-6 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    Clear Search
                </button>
            </motion.div>
        )}

        {/* --- SUGGESTED PEOPLE SECTION (REAL DB DATA) --- */}
        {(filter === 'all' || filter === 'people') && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {searchQuery ? `People matching "${searchQuery}"` : "People you may know"}
                </h2>
                <button className="text-sm font-medium text-yellow-600 dark:text-yellow-500 hover:underline">See all</button>
            </div>

            {loading ? (
                 <div className="flex gap-4 overflow-hidden px-2">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex flex-col gap-3 shrink-0">
                            <Skeleton className="w-[220px] h-[280px] rounded-3xl" />
                        </div>
                    ))}
                 </div>
            ) : filteredPeople.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 -mx-2 scrollbar-hide snap-x">
                    {filteredPeople.map((person) => {
                        const isFollowing = followedUsernames.has(person.username);
                        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}`;
                        
                        return (
                        <div key={person.id} className="snap-start shrink-0 w-[200px] bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-lg shadow-neutral-200/50 dark:shadow-none hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            {/* Hover Gradient Border Effect */}
                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-400 rounded-3xl transition-colors pointer-events-none" />
                            
                            <Link href={`/profile/${person.username}`} className="w-full flex flex-col items-center gap-4 flex-1">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-inner card-zoom-hover">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-900">
                                            <img src={avatar} alt={person.username} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black dark:bg-white text-white dark:text-black rounded-full p-1.5 shadow-lg">
                                        <Shield className="w-3 h-3" />
                                    </div>
                                </div>

                                <div className="space-y-1 w-full flex-1">
                                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white truncate hover:underline decoration-neutral-400 underline-offset-4" title={person.name || person.username}>
                                        {person.name || person.username}
                                    </h3>
                                    {/* Suggestion Text */}
                                    {person.matchPercentage ? (
                                        <div className="flex items-center gap-1.5 mb-1 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                                            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            <p className="text-[10px] text-yellow-700 dark:text-yellow-400 font-extrabold tracking-tight">
                                                {person.matchPercentage}% Match
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-indigo-500 font-bold tracking-tight mb-1">
                                            Suggested because you like {person.skills?.split(',')[0] || 'Tech'}
                                        </p>
                                    )}
                                    {(person.skills || person.college) && (
                                        <p className="text-xs font-medium text-neutral-500 truncate" title={person.skills || person.college || ""}>
                                            {person.skills?.split(',')[0] || person.college}
                                        </p>
                                    )}
                                    {!person.skills && !person.college && (
                                         <p className="text-xs font-medium text-neutral-500 truncate">Member</p>
                                    )}
                                </div>
                                
                                <div className="flex items-center justify-center gap-1 h-5">
                                     {person.location ? (
                                        <p className="text-[10px] uppercase font-bold tracking-wide text-neutral-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {person.location}
                                        </p>
                                     ) : (
                                        <p className="text-[10px] uppercase font-bold tracking-wide text-neutral-400">
                                            New to TeamUp
                                        </p>
                                     )}
                                </div>
                            </Link>

                            <div className="flex items-center gap-2 w-full mt-auto">
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFollow(person.username);
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                        isFollowing 
                                        ? "bg-neutral-100 text-neutral-900 border border-neutral-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-red-900/20 dark:hover:text-red-400" 
                                        : "bg-neutral-900 text-white hover:bg-black hover:shadow-lg hover:shadow-neutral-500/20 active:scale-95 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                                    }`}
                                >
                                    {isFollowing ? "Following" : "Follow"}
                                </button>
                                
                                <Link
                                    href={`/chat?userId=${person.id}`}
                                    className="p-2.5 rounded-xl bg-neutral-100 text-neutral-900 border border-neutral-200 hover:bg-yellow-400 hover:border-yellow-400 hover:text-neutral-950 hover:shadow-lg dark:bg-neutral-800 dark:text-white dark:border-neutral-700 dark:hover:bg-yellow-400 dark:hover:text-neutral-950 transition-all active:scale-95"
                                    title="Message"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </Link>
                            </div>
                        </div>
                    )})}
                </div>
            ) : (
                 <div className="text-center py-10 opacity-60">
                    <p>No people found.</p>
                </div>
            )}
        </motion.div>
        )}


        {/* --- TEAMS LINK (Moved to standalone page) --- */}
        {(filter === 'all' || filter === 'people') && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-yellow-200 dark:border-yellow-800/50 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 text-center"
          >
            <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/25">
              <Users className="h-7 w-7 text-neutral-900" />
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Looking for a Team?</h3>
            <p className="text-sm text-neutral-500 mb-4">Browse teams or create your own hackathon squad</p>
            <Link 
              href="/teams"
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-neutral-900 hover:bg-yellow-500 transition-colors"
            >
              <Users className="h-5 w-5" />
              Explore Teams
            </Link>
          </motion.div>
        )}

        {/* --- HACKATHONS SECTION (REAL) --- */}
        {/* --- HACKATHONS SECTION (CURATED) --- */}
        {/* --- HACKATHONS SECTION (REAL) --- */}
        {/* --- HACKATHONS SECTION (CURATED) --- */}
        {(filter === 'all' || filter === 'hackathons') && (
        <div className="space-y-20">
            {/* 1. Trending (or Search Results) */}
            <HackathonSection 
                title={searchQuery ? "Search Results" : "🔥 Trending Hackathons"} 
                subtitle={searchQuery ? `Found ${filteredHackathons.length} matches` : "The hottest events happening right now."}
                icon={Trophy}
                category="trending"
                hackathons={searchQuery ? filteredHackathons : trendingHackathons}
                userId={userId}
                isProfileComplete={isProfileComplete}
                loading={loading}
            />

            {/* 2. Live Hackathons (MOVED TO /discover/hackathons) */}
            
            {/* 3. Upcoming Hackathons (MOVED TO /discover/hackathons) */}
        </div>
        )}

        {/* --- INTERNSHIPS SECTION --- */}
        {(filter === 'all' || filter === 'internships') && filteredInternships.length > 0 && (
        <div className="space-y-8">
            <div className="flex items-end justify-between px-2">
                <div>
                   <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-yellow-500" />
                        {searchQuery ? `Internships matching "${searchQuery}"` : "Top Internships"}
                   </h2>
                   <p className="mt-2 text-neutral-500 dark:text-neutral-400">Handpicked opportunities for you to kickstart your career.</p>
                </div>
                <Link href="/discover/internships" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
            >
                {filteredInternships.map((job) => (
                    <motion.div key={job.id} variants={item} className="group relative">
                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${job.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                        <div className={`relative h-full flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg shadow-neutral-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/50 dark:backdrop-blur-sm ${job.border}`}>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-neutral-800 p-2 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center">
                                        <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                                        {job.duration}
                                    </span>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-xl text-neutral-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                                        {job.role}
                                    </h3>
                                    <p className="text-sm font-medium text-neutral-500 mt-1">{job.company}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    {job.tags.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-600 dark:bg-neutral-800/50 dark:border-neutral-700 dark:text-neutral-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs text-neutral-400">Stipend</span>
                                    <span className={`font-bold ${job.text_color}`}>{job.stipend}</span>
                                </div>
                                <div className="flex gap-2">
                                     <button className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                        Details
                                    </button>
                                     <button className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-lg shadow-neutral-500/20">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
        )}

      </div>
    </div>
  );
}
