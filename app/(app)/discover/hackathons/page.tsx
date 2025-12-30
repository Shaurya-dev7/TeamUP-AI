"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, ChevronDown, Check, Trophy, 
  Calendar, Users, Rocket, Target, Globe, 
  Zap, Clock, MapPin, ExternalLink, Flame, 
  Code, Cpu, Wallet, Heart, Activity
} from "lucide-react";
import Link from "next/link";


// --- Mock Data ---
const organizers = [
    { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png" },
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/1280px-Microsoft_logo_%282012%29.svg.png" },
    { name: "Ethereum", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/1200px-Ethereum-icon-purple.svg.png" },
    { name: "OpenAI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1024px-OpenAI_Logo.svg.png" },
    { name: "Polygon", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Polygon_Blockchain_Matic_Logo.svg/2560px-Polygon_Blockchain_Matic_Logo.svg.png" },
];

const categories = [
  { id: 'all', label: 'All Themes', icon: Globe },
  { id: 'ai', label: 'AI & ML', icon: Cpu },
  { id: 'web3', label: 'Web3', icon: Wallet },
  { id: 'social', label: 'Social Good', icon: Heart },
  { id: 'fintech', label: 'FinTech', icon: Activity },
];

const sortOptions = [
  { id: 'prize', label: 'Highest Prizes' },
  { id: 'soon', label: 'Ending Soon' },
  { id: 'new', label: 'Newest Added' },
];

const hackathons = [
  {
    id: 1,
    title: "Global AI Championship",
    organizer: "OpenAI x Google",
    category: "ai",
    status: "live", 
    prizePool: "$150,000",
    participants: 4200,
    daysLeft: 5,
    date: "Dec 30 - Jan 04",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-blue-600 to-purple-600",
    tags: ["Generative AI", "LLMs", "Python"],
    teamSize: "1-4",
    difficulty: "Hard",
    isFeatured: true
  },
  {
    id: 2,
    title: "ETH Global Istanbul",
    organizer: "ETH Global",
    category: "web3",
    status: "upcoming",
    prizePool: "$50,000",
    participants: 900,
    daysLeft: 12,
    date: "Jan 12 - Jan 14",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-slate-900 to-slate-700",
    tags: ["Ethereum", "DeFi", "Solidity"],
    teamSize: "2-5",
    difficulty: "Medium",
    isFeatured: true
  },
  {
    id: 3,
    title: "EcoFuture Hack 2024",
    organizer: "TechCrunch",
    category: "social",
    status: "live",
    prizePool: "$25,000",
    participants: 1500,
    daysLeft: 2,
    date: "Dec 28 - Jan 01",
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-green-500 to-emerald-700",
    tags: ["Climate", "CleanTech", "IoT"],
    teamSize: "1-3",
    difficulty: "Beginner",
    isFeatured: false
  },
  {
    id: 4,
    title: "FinTech Revolution",
    organizer: "Stripe",
    category: "fintech",
    status: "upcoming",
    prizePool: "$75,000",
    participants: 2100,
    daysLeft: 20,
    date: "Jan 20 - Jan 25",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-indigo-500 to-purple-500",
    tags: ["Payments", "API", "Banking"],
    teamSize: "2-4",
    difficulty: "Advanced",
    isFeatured: true
  },
  {
    id: 5,
    title: "Health Innovation Challenge",
    organizer: "HIMSS",
    category: "health",
    status: "live",
    prizePool: "$40,000",
    participants: 850,
    daysLeft: 8,
    date: "Jan 05 - Jan 10",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-rose-500 to-pink-600",
    tags: ["MedTech", "Data", "Research"],
    teamSize: "1-5",
    difficulty: "Medium",
    isFeatured: false
  },
   {
    id: 6,
    title: "GameDev Madness",
    organizer: "Unity",
    category: "ai", 
    status: "upcoming",
    prizePool: "$30,000",
    participants: 3000,
    daysLeft: 15,
    date: "Jan 15 - Jan 17",
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2000&auto=format&fit=crop",
    gradient: "from-orange-500 to-red-500",
    tags: ["Gaming", "Unity", "3D"],
    teamSize: "Solo/Team",
    difficulty: "All Levels",
    isFeatured: false
  },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("prize");
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter Logic
  const filteredHackathons = hackathons.filter(hack => {
    const matchesSearch = 
      hack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hack.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hack.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || hack.category === selectedCategory;
    
    const matchesLive = !showLiveOnly || hack.status === 'live';

    return matchesSearch && matchesCategory && matchesLive;
  }).sort((a, b) => {
    if (sortBy === 'prize') { 
         return parseInt(b.prizePool.replace(/\D/g,'')) - parseInt(a.prizePool.replace(/\D/g,''));
    }
    if (sortBy === 'soon') return a.daysLeft - b.daysLeft;
    return 0; // default
  });

  const featured = filteredHackathons.filter(h => h.isFeatured);
  const endingSoon = [...filteredHackathons].sort((a,b) => a.daysLeft - b.daysLeft).slice(0, 4);
  const isFiltering = searchQuery || selectedCategory !== 'all' || showLiveOnly;

  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden bg-[#FAFAFA] dark:bg-[#050505]">
      {/* Background */}
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* --- HERO SECTION --- */}
        <div className="space-y-8">
            <Link 
                href="/discover" 
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
                <ChevronDown className="rotate-90 w-4 h-4" /> Back to Discover
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
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1]"
                    >
                        Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400">Future.</span> <br />
                        Win the <span className="underline decoration-yellow-400/50 decoration-4 underline-offset-4">Glory.</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl"
                    >
                        Join 100,000+ developers competing in the world's biggest hackathons. 
                        Millions in prizes, funding, and networking await.
                    </motion.p>
                </div>

                {/* --- STATS CARD (Decoration) --- */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="hidden lg:block relative p-6 rounded-3xl bg-neutral-900 dark:bg-white/5 backdrop-blur-xl border border-neutral-800 dark:border-white/10 shadow-2xl skew-y-[-2deg] hover:skew-y-0 transition-transform duration-500"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                            🏆
                        </div>
                        <div>
                            <p className="text-neutral-400 text-xs uppercase font-bold">Total Prizes</p>
                            <p className="text-2xl font-bold text-white">$2,500,000+</p>
                        </div>
                    </div>
                     <div className="flex -space-x-2">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-xs text-white">
                                👾
                            </div>
                        ))}
                         <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-700 flex items-center justify-center text-[10px] text-white font-bold">
                                +2k
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        {/* --- ORGANIZERS MARQUEE (New) --- */}
        <div className="w-full overflow-hidden py-8 border-y border-neutral-200 dark:border-neutral-800/50">
            <p className="text-center text-sm font-semibold text-neutral-500 mb-6 uppercase tracking-widest">Trusted by Top Organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-8 px-4">
                 {organizers.map((org, i) => (
                    <div key={i} className="h-16 w-40 bg-white rounded-xl flex items-center justify-center p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 hover:shadow-md transition-shadow group">
                        <img src={org.logo} alt={org.name} className="h-full w-full object-contain" />
                    </div>
                 ))}
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
             <div className="relative w-full md:w-auto md:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                    type="text"
                    placeholder="Search hackathons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 ring-purple-500/50 transition-all"
                />
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat.id
                            ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-black"
                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:bg-transparent dark:border-neutral-800 dark:text-neutral-400"
                        }`}
                    >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Other Filters */}
             <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                    onClick={() => setShowLiveOnly(!showLiveOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                        showLiveOnly
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 animate-pulse"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400"
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${showLiveOnly ? 'bg-current' : 'bg-neutral-400'}`} />
                    Live
                </button>

                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
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
        {isFiltering ? (
             <div className="space-y-6">
               <motion.div 
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                   className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
               >
                   {filteredHackathons.map(hack => <HackathonCard key={hack.id} hackathon={hack} />)}
               </motion.div>
            </div>
        ) : (
            <>
                {/* Featured Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Featured Competitions</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {featured.map(hack => <HackathonCard key={hack.id} hackathon={hack} featured />)}
                    </motion.div>
                </section>

                {/* Ending Soon Strip */}
                 <section className="space-y-6 pt-8">
                     <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-red-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Ending Soon</h2>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                         {endingSoon.map(hack => <CompactHackathonCard key={hack.id} hackathon={hack} />)}
                    </div>
                </section>

                {/* All Others */}
                 <section className="space-y-6 pt-8">
                     <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">More Opportunities</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredHackathons.filter(h => !h.isFeatured).map(hack => <HackathonCard key={hack.id} hackathon={hack} />)}
                    </motion.div>
                </section>
            </>
        )}

      </div>
    </div>
  );
}

// --- CARD COMPONENTS ---

function HackathonCard({ hackathon, featured }: { hackathon: any, featured?: boolean }) {
    return (
        <motion.div 
            variants={itemVariants}
            className="group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
             {/* Rich Image Header */}
            <div className="relative h-64 w-full overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10`} />
                <div className={`absolute inset-0 bg-gradient-to-r ${hackathon.gradient} opacity-60 mix-blend-multiply z-10`} />
                
                <img 
                    src={hackathon.image} 
                    alt={hackathon.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                />

                {/* Status Pills */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                    {hackathon.status === 'live' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-lg animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE NOW
                        </span>
                    )}
                     {featured && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-bold shadow-lg">
                            <Zap className="w-3 h-3 fill-black" /> FEATURED
                        </span>
                    )}
                </div>

                {/* Difficulty Badge */}
                 <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold">
                        {hackathon.difficulty}
                    </span>
                </div>
                
                 {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                     <p className="text-xs font-bold text-white/70 tracking-wider uppercase mb-1 flex items-center gap-1">
                        {hackathon.organizer}
                     </p>
                     <h3 className="text-2xl font-bold text-white leading-tight">{hackathon.title}</h3>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-6 gap-6">
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Prize Pool</p>
                        <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{hackathon.prizePool}</p>
                    </div>
                     <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Participants</p>
                        <p className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-500" /> {hackathon.participants}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                     <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Team: {hackathon.teamSize}
                     </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {hackathon.daysLeft} days left
                     </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {hackathon.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Action */}
                <button className="w-full mt-auto py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2">
                    Register Now <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

function CompactHackathonCard({ hackathon }: { hackathon: any }) {
    return (
        <div className="flex-shrink-0 w-[280px] p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-red-500/50 transition-colors group cursor-pointer">
            <div className="flex items-start gap-4">
                <img src={hackathon.image} className="w-16 h-16 rounded-2xl object-cover" />
                <div>
                     <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Ends in {hackathon.daysLeft} days</span>
                     <h4 className="font-bold text-neutral-900 dark:text-white leading-tight mt-1 group-hover:underline">{hackathon.title}</h4>
                     <p className="text-xs text-neutral-500 mt-1">{hackathon.prizePool}</p>
                </div>
            </div>
        </div>
    )
}
