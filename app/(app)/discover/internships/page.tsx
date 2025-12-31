"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Check, Briefcase, MapPin, Building2, 
  Globe, Clock, ArrowUpRight, Zap, Coffee, 
  Laptop, Banknote, Users, Sparkles, Filter, ChevronDown, 
  Bookmark, Star, Rocket, Plane, HandCoins
} from "lucide-react";
import Link from "next/link";

// --- Mock Data ---
const partners = [
    { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/2560px-Google_2015_logo.svg.png" },
    { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Microsoft_logo_%282012%29.svg/1280px-Microsoft_logo_%282012%29.svg.png" },
    { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png" },
    { name: "Tesla", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/1200px-Tesla_Motors.svg.png" },
    { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/1280px-Netflix_2015_logo.svg.png" },
    { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png" },
];



const categories = [
  { id: 'all', label: 'All Roles' },
  { id: 'eng', label: 'Engineering' },
  { id: 'design', label: 'Design' },
  { id: 'product', label: 'Product' },
  { id: 'marketing', label: 'Marketing' },
];

const sortOptions = [
    { id: 'newest', label: 'Newest Added' },
    { id: 'salary', label: 'Highest Salary' },
    { id: 'rel', label: 'Most Relevant' },
];

const durationOptions = [
    { id: 'all', label: 'Any Duration' },
    { id: 'summer', label: 'Summer 2024' },
    { id: 'fall', label: 'Fall 2024' },
    { id: '6m', label: '6 Months+' },
];

// Expanded Job Data
const jobs = [
    // -- Big Tech --
  {
    id: 1,
    role: "Frontend Engineer Intern",
    company: "Vercel",
    logo: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png",
    location: "Remote",
    type: "Summer 2024",
    salary: "$60/hr",
    category: "eng",
    isRemote: true,
    tags: ["React", "Next.js", "TypeScript"],
    perks: ["remote", "equipment", "visa"],
    applicants: 124,
    deadline: "2 days left",
    color: "from-black to-neutral-800",
    isHighPaying: true,
    isStartup: false
  },
  {
    id: 2,
    role: "Product Design Intern",
    company: "Airbnb",
    logo: "https://a0.muscache.com/airbnb/static/icons/android-icon-192x192-c0465f9f0380893768972a31a614b670.png",
    location: "San Francisco, CA",
    type: "Summer 2024",
    salary: "$65/hr",
    category: "design",
    isRemote: false,
    tags: ["Figma", "Design Systems"],
    perks: ["food", "housing"],
    applicants: 856,
    deadline: "1 week left",
    color: "from-rose-500 to-pink-600",
    isHighPaying: true,
    isStartup: false
  },
  // -- Startups --
  {
    id: 3,
    role: "Founding Engineer Intern",
    company: "Perplexity AI",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.jpg?20230524054013", // using placeholder logic or external
    location: "San Francisco, CA",
    type: "Fall 2024",
    salary: "$50/hr + Equity",
    category: "eng",
    isRemote: false,
    tags: ["LLMs", "Rust", "Search"],
    perks: ["food", "equity"],
    applicants: 45,
    deadline: "Urgent",
    color: "from-teal-500 to-cyan-600",
    isHighPaying: false,
    isStartup: true
  },
  {
    id: 4,
    role: "Growth Marketing Intern",
    company: "Linear",
    logo: "https://linear.app/favicon.ico",
    location: "Remote",
    type: "6 Months+",
    salary: "$40/hr",
    category: "marketing",
    isRemote: true,
    tags: ["SaaS", "Content", "Brand"],
    perks: ["remote", "swag"],
    applicants: 200,
    deadline: "Open",
    color: "from-indigo-500 to-purple-600",
    isHighPaying: false,
    isStartup: true
  },
  // -- More Big Tech --
  {
    id: 5,
    role: "Software Engineer Intern",
    company: "Netflix",
    logo: "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.png",
    location: "Los Gatos, CA",
    type: "Summer 2024",
    salary: "$90/hr",
    category: "eng",
    isRemote: false,
    tags: ["Java", "Distributed Systems"],
    perks: ["food", "housing", "transport"],
    applicants: 2300,
    deadline: "Apply Now",
    color: "from-red-600 to-red-800",
    isHighPaying: true,
    isStartup: false
  },
  {
    id: 6,
    role: "Data Science Intern",
    company: "Spotify",
    logo: "https://www.scdn.co/i/_global/favicon.png",
    location: "New York, NY",
    type: "Fall 2024",
    salary: "$55/hr",
    category: "data",
    isRemote: false,
    tags: ["Python", "ML", "BigQuery"],
    perks: ["music", "food", "visa"],
    applicants: 420,
    deadline: "3 weeks left",
    color: "from-green-500 to-emerald-600",
    isHighPaying: false,
    isStartup: false
  },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0,
    transition: { type: "spring" as const, stiffness: 50 } 
  }
};

export default function DiscoverInternshipsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);

  const toggleSave = (id: number) => {
      setSavedJobs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesRemote = !remoteOnly || job.isRemote;
    
    // Simple duration matching (mock logic)
    const matchesDuration = selectedDuration === 'all' || 
                            (selectedDuration === 'summer' && job.type.includes('Summer')) ||
                            (selectedDuration === 'fall' && job.type.includes('Fall')) ||
                            (selectedDuration === '6m' && job.type.includes('Month'));


    return matchesSearch && matchesCategory && matchesRemote && matchesDuration;
  }).sort((a,b) => {
      if(sortBy === 'salary') {
          return parseInt(b.salary.replace(/\D/g,'')) - parseInt(a.salary.replace(/\D/g,''));
      }
      return 0; // default (id/newest)
  });

  const highPaying = filteredJobs.filter(j => j.isHighPaying);
  const startups = filteredJobs.filter(j => j.isStartup);
  const others = filteredJobs.filter(j => !j.isHighPaying && !j.isStartup);

  const isFiltering = searchQuery || selectedCategory !== 'all' || remoteOnly || selectedDuration !== 'all' || sortBy !== 'newest';

  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden bg-[#FAFAFA] dark:bg-[#050505]">
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* --- HERO --- */}
        <div className="space-y-8">
             <Link 
                href="/discover" 
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
                <ChevronDown className="rotate-90 w-4 h-4" /> Back to Discover
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                <div className="space-y-6 max-w-3xl">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider"
                    >
                        <Plane className="w-3.5 h-3.5" /> Launch Your Career
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white"
                    >
                        Find Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400">Dream Internship.</span>
                    </motion.h1>
                    
                    <motion.p 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ delay: 0.2 }}
                         className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl"
                    >
                        Apply to 5,000+ top-tier internships. Verified salaries, direct recruiter links, and exclusive startup roles.
                    </motion.p>
                </div>
            </div>
        </div>

        {/* --- PARTNERS MARQUEE --- */}
        <div className="w-full overflow-hidden py-6 border-y border-neutral-200 dark:border-neutral-800/50">
             <p className="text-center text-sm font-semibold text-neutral-500 mb-6 uppercase tracking-widest">Hiring Partners</p>
             <div className="flex flex-wrap justify-center items-center gap-8 px-4">
                 {partners.map((p, i) => (
                    <div key={i} className="h-16 w-40 bg-white rounded-xl flex items-center justify-center p-4 shadow-sm border border-neutral-100 dark:border-neutral-800 hover:shadow-md transition-shadow">
                        <img src={p.logo} alt={p.name} className="h-full w-full object-contain" />
                    </div>
                 ))}
             </div>
        </div>


        {/* --- CONTROLS --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
        >
             <div className="relative w-full xl:w-auto xl:min-w-[350px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                    type="text"
                    placeholder="Search roles, companies, perks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 ring-emerald-500/50 transition-all"
                />
            </div>

             <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                            selectedCategory === cat.id
                            ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-black"
                            : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:bg-transparent dark:border-neutral-800 dark:text-neutral-400"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

             <div className="flex items-center gap-2 w-full xl:w-auto justify-between md:justify-end flex-wrap">
                 {/* Duration Filter */}
                <div className="relative">
                     <button
                        onClick={() => setIsDurationOpen(!isDurationOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                     >
                         <Clock className="w-3.5 h-3.5" />
                         {durationOptions.find(d => d.id === selectedDuration)?.label}
                         <ChevronDown className="w-3 h-3 ml-1" />
                     </button>
                      <AnimatePresence>
                        {isDurationOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                            >
                                {durationOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setSelectedDuration(option.id); setIsDurationOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                 {/* Remote Toggle */}
                <button
                    onClick={() => setRemoteOnly(!remoteOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                        remoteOnly
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-400"
                    }`}
                >
                    {remoteOnly ? <Check className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    Remote
                </button>

                 {/* Sort Dropdown */}
                 <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    >
                       <span>{sortOptions.find(o => o.id === sortBy)?.label}</span>
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

        {/* --- CONTENT --- */}
        {isFiltering ? (
            <div className="space-y-6">
                 <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {filteredJobs.length} Results
                </h2>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {filteredJobs.map(job => (
                        <InternshipCard 
                            key={job.id} 
                            job={job} 
                            isSaved={savedJobs.includes(job.id)}
                            onToggleSave={() => toggleSave(job.id)}
                        />
                    ))}
                </motion.div>
            </div>
        ) : (
             <>
                 {/* High Paying Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Top Paying & Big Tech</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {highPaying.map(job => (
                            <InternshipCard 
                                key={job.id} 
                                job={job} 
                                isSaved={savedJobs.includes(job.id)}
                                onToggleSave={() => toggleSave(job.id)}
                            />
                        ))}
                    </motion.div>
                </section>

                {/* Featured Startups Section (New) */}
                 <section className="space-y-6 pt-10">
                    <div className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-purple-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Fast-Growing Startups</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {startups.map(job => (
                            <InternshipCard 
                                key={job.id} 
                                job={job} 
                                isSaved={savedJobs.includes(job.id)}
                                onToggleSave={() => toggleSave(job.id)}
                            />
                        ))}
                    </motion.div>
                </section>

                {/* Latest Section */}
                 <section className="space-y-6 pt-10">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Newest Opportunities</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {others.map(job => (
                           <InternshipCard 
                                key={job.id} 
                                job={job} 
                                isSaved={savedJobs.includes(job.id)}
                                onToggleSave={() => toggleSave(job.id)}
                            />
                        ))}
                    </motion.div>
                </section>
             </>
        )}

      </div>
    </div>
  );
}

function InternshipCard({ job, isSaved, onToggleSave }: { job: any, isSaved: boolean, onToggleSave: () => void }) {
    
    const getPerkIcon = (perk: string) => {
        if(perk === 'remote') return <Laptop className="w-3 h-3" />;
        if(perk === 'food') return <Coffee className="w-3 h-3" />;
         if(perk === 'visa') return <Plane className="w-3 h-3" />;
         if(perk === 'equity') return <HandCoins className="w-3 h-3" />;
        return <Check className="w-3 h-3" />;
    }

    return (
        <motion.div 
            variants={itemVariants}
            className="group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
        >
             {/* Gradient Accent */}
             <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${job.color}`} />
             
             {/* Header */}
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-xl bg-white dark:bg-neutral-800 p-2 shadow-sm border border-neutral-100 dark:border-neutral-700 flex items-center justify-center">
                        {/* Placeholder logic for external logos vs generic */}
                         {job.logo.startsWith('http') ? (
                             <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                         ) : (
                             <Building2 className="w-6 h-6 text-neutral-400" />
                         )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {job.role}
                        </h3>
                         <div className="flex items-center gap-2">
                             <p className="font-semibold text-sm text-neutral-500">{job.company}</p>
                             {job.isStartup && <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-wide">Startup</span>}
                         </div>
                    </div>
                </div>
                 <button 
                    onClick={(e) => { e.preventDefault(); onToggleSave(); }}
                    className={`p-2 rounded-full transition-colors ${isSaved ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                 >
                     <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                 </button>
             </div>

             {/* Details Grid */}
             <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-400" /> {job.location}
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" /> {job.type}
                </div>
                <div className="flex items-center gap-2 col-span-2">
                    <Users className="w-4 h-4 text-neutral-400" /> {job.applicants} applicants
                </div>
             </div>

             {/* Tags & Perks */}
             <div className="mt-auto space-y-4">
                 <div className="flex flex-wrap gap-2">
                     {job.tags.slice(0, 3).map((tag: string) => (
                         <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                             {tag}
                         </span>
                     ))}
                 </div>

                  {/* Perks Strip */}
                 <div className="flex items-center gap-2 pt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800 overflow-hidden">
                    {job.perks.map((perk: string) => (
                        <div key={perk} className="flex items-center gap-1 text-[10px] font-bold uppercase text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 px-2 py-1 rounded-full whitespace-nowrap">
                            {getPerkIcon(perk)} {perk}
                        </div>
                    ))}
                 </div>

                 <div className="flex items-center justify-between pt-2">
                     <div className="flex flex-col">
                         <span className="text-xs font-medium text-neutral-400 uppercase">Hourly Rate</span>
                         <span className="text-xl font-extrabold text-neutral-900 dark:text-white">{job.salary}</span>
                     </div>
                     <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                         Apply <ArrowUpRight className="w-4 h-4" />
                     </button>
                 </div>
             </div>
        </motion.div>
    );
}
