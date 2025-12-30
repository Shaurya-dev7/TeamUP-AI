"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, DollarSign, Clock, ArrowRight, Shield, Code, Brain, Cloud, Briefcase, Trophy, Calendar } from "lucide-react";
import Link from "next/link";
import { BackgroundEffects } from "./_components/BackgroundEffects";

// Mock Data
const hackathons = [
  {
    id: 1,
    name: "Global AI Challenge 2024",
    organizer: "TechCrunch",
    date: "Oct 15 - 17, 2024",
    prizes: "$50,000 Pool",
    participants: "1,200+",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=300&h=200",
    tags: ["AI/ML", "Python", "Open Source"],
    gradient: "from-blue-600 to-purple-600",
  },
  {
    id: 2,
    name: "Web3 Innovation Jam",
    organizer: "Ethereum Fdn",
    date: "Nov 05 - 08, 2024",
    prizes: "$25,000 + Grants",
    participants: "800+",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=300&h=200",
    tags: ["Blockchain", "Solidity", "DeFi"],
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: 3,
    name: "Green Tech Summit",
    organizer: "Google Devs",
    date: "Dec 10 - 12, 2024",
    prizes: "$30,000 Pool",
    participants: "600+",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300&h=200",
    tags: ["Sustainability", "IoT", "Cloud"],
    gradient: "from-emerald-500 to-teal-500",
  },
];

const internships = [
  {
    id: 1,
    role: "Frontend Developer Intern",
    company: "Vercel",
    logo: "https://assets.vercel.com/image/upload/front/favicon/vercel/180x180.png",
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
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg",
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
    logo: "https://logo.clearbit.com/spotify.com",
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
    logo: "https://logo.clearbit.com/airbnb.com",
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
    logo: "https://logo.clearbit.com/amazon.com",
    location: "Seattle, WA",
    stipend: "$3,000/month",
    duration: "5 Months",
    tags: ["AWS", "Kubernetes", "Go"],
    color: "from-orange-500/20 to-amber-500/20",
    border: "group-hover:border-orange-500/50",
    text_color: "text-orange-600 dark:text-orange-400",
  },
];

const courses = [
  {
    id: 1,
    title: "Cybersecurity Essentials",
    provider: "SecureNet Academy",
    students: "12k+ Students",
    rating: "4.8",
    image: "shield", 
    gradient: "from-red-500 to-orange-600",
  },
  {
    id: 2,
    title: "Full Stack Web Dev",
    provider: "CodeMastery",
    students: "45k+ Students",
    rating: "4.9",
    image: "code",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    id: 3,
    title: "Machine Learning A-Z",
    provider: "DataScience Pro",
    students: "28k+ Students",
    rating: "4.7",
    image: "brain",
    gradient: "from-purple-600 to-pink-500",
  },
   {
    id: 4,
    title: "Cloud Computing AWS",
    provider: "Cloud Certified",
    students: "18k+ Students",
    rating: "4.8",
    image: "cloud",
    gradient: "from-amber-500 to-yellow-500",
  },
];

const suggestedPeople = [
  {
    id: 1,
    name: "Elena Rodriguez",
    username: "elena_code",
    role: "Senior UX Designer",
    mutuals: "3 mutual connections",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
  },
  {
    id: 2,
    name: "David Kim",
    username: "david_dev",
    role: "Full Stack Developer",
    mutuals: "Followed by sarah_j",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
  },
  {
    id: 3,
    name: "Sarah Chen",
    username: "sarah_ui",
    role: "Product Manager",
    mutuals: "New to TeamUp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: 4,
    name: "Michael Park",
    username: "mike_ai",
    role: "ML Engineer",
    mutuals: "5 mutual connections",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
  },
   {
    id: 5,
    name: "Jessica Lee",
    username: "jess_cloud",
    role: "DevOps Engineer",
    mutuals: "Followed by alex_t",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
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


export default function DiscoverDemoPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPeople = suggestedPeople.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInternships = internships.filter(i => 
    i.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHackathons = hackathons.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasResults = filteredPeople.length > 0 || filteredInternships.length > 0 || filteredCourses.length > 0 || filteredHackathons.length > 0;

  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden">
      <BackgroundEffects />
      
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
             className="relative max-w-xl mx-auto group"
          >
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative flex items-center gap-3 rounded-full border border-neutral-200 bg-white/50 p-2 pl-6 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/50">
                <Search className="h-5 w-5 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Search internships, courses, or skills..." 
                  className="w-full bg-transparent outline-none text-neutral-900 dark:text-white placeholder:text-neutral-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                 <button className="rounded-full bg-neutral-900 px-6 py-3 font-bold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-neutral-950">
                Search
              </button>
            </div>
          </motion.div>
        </div>

        {/* No Results Message */}
        {searchQuery && !hasResults && (
            <div className="text-center py-20">
                <p className="text-xl text-neutral-500">No results found for "{searchQuery}"</p>
            </div>
        )}

        {/* --- SUGGESTED PEOPLE SECTION --- */}
        {filteredPeople.length > 0 && (
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

            <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-2 -mx-2 scrollbar-hide snap-x">
                {filteredPeople.map((person) => (
                    <div key={person.id} className="snap-start shrink-0 w-[200px] bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800 rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-lg shadow-neutral-200/50 dark:shadow-none hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                        {/* Hover Gradient Border Effect */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-400 rounded-3xl transition-colors pointer-events-none" />
                        
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-inner">
                                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-900">
                                    <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                </div>
                            </div>
                             <button className="absolute bottom-1 right-1 bg-black dark:bg-white text-white dark:text-black rounded-full p-2 shadow-lg hover:scale-110 transition-transform hover:bg-neutral-800">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                             </button>
                        </div>

                        <div className="space-y-1 w-full">
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white truncate">{person.name}</h3>
                            <p className="text-sm font-medium text-neutral-500 truncate">@{person.username}</p>
                        </div>
                        
                         <div className="flex items-center justify-center gap-1 h-5">
                            <div className="flex -space-x-2">
                                <div className="w-4 h-4 rounded-full bg-neutral-200 border border-white"></div>
                                <div className="w-4 h-4 rounded-full bg-neutral-300 border border-white"></div>
                            </div>
                            <p className="text-[10px] uppercase font-bold tracking-wide text-neutral-400">
                                {person.mutuals.replace(" mutual connections", "").replace("Followed by ", "")} Mutuals
                            </p>
                         </div>

                        <button className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-sm hover:bg-black hover:shadow-lg hover:shadow-neutral-500/20 active:scale-95 transition-all dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
        )}

        {/* --- HACKATHONS SECTION (NEW) --- */}
        {filteredHackathons.length > 0 && (
        <div className="space-y-6">
            <div className="flex items-end justify-between px-2">
                <div>
                   <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        {searchQuery ? `Hackathons matching "${searchQuery}"` : "Trending Hackathons"}
                   </h2>
                   <p className="mt-2 text-neutral-500 dark:text-neutral-400">Compete, build, and win big in upcoming events.</p>
                </div>
                <button className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="grid gap-6 md:grid-cols-3"
            >
                {filteredHackathons.map((hackathon) => (
                    <motion.div key={hackathon.id} variants={item} className="group relative cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl transform transition-transform duration-300 group-hover:scale-[1.02] -z-10 shadow-xl" />
                        
                        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 h-full flex flex-col">
                            {/* Image Header with Gradient Overlay */}
                            <div className="h-32 w-full relative overflow-hidden">
                                <div className={`absolute inset-0 bg-gradient-to-r ${hackathon.gradient} opacity-80 mix-blend-multiply dark:mix-blend-overlay z-10`} />
                                <img src={hackathon.image} alt={hackathon.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute top-4 right-4 z-20 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1 shadow-sm">
                                    <Calendar className="w-3 h-3" />
                                    {hackathon.date}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col items-start gap-3 flex-1">
                                <div>
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1">{hackathon.organizer}</p>
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                                        {hackathon.name}
                                    </h3>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        <span className="font-semibold text-neutral-900 dark:text-white">{hackathon.prizes}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span>{hackathon.participants} registered</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4 w-full">
                                    {hackathon.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                
                                <button className="w-full mt-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
        )}

        {/* --- INTERNSHIPS SECTION --- */}
        {filteredInternships.length > 0 && (
        <div className="space-y-8">
            <div className="flex items-end justify-between px-2">
                <div>
                   <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-yellow-500" />
                        {searchQuery ? `Internships matching "${searchQuery}"` : "Top Internships"}
                   </h2>
                   <p className="mt-2 text-neutral-500 dark:text-neutral-400">Handpicked opportunities for you to kickstart your career.</p>
                </div>
                <Link href="#" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1">
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


         {/* --- COURSES SECTION --- */}
         {filteredCourses.length > 0 && (
         <div className="space-y-8 pb-20">
            <div className="flex items-end justify-between px-2">
                 <div>
                   <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                        <Brain className="h-6 w-6 text-yellow-500" />
                         {searchQuery ? `Courses matching "${searchQuery}"` : "Recommended Courses"}
                   </h2>
                   <p className="mt-2 text-neutral-500 dark:text-neutral-400">Upskill yourself with these trending courses.</p>
                </div>
                 <Link href="#" className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1">
                    View all <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <motion.div 
                 variants={container}
                 initial="hidden"
                 whileInView="show"
                 viewport={{ once: true, margin: "-100px" }}
                 className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                 {filteredCourses.map((course) => (
                    <motion.div key={course.id} variants={item} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 dark:bg-neutral-900 text-white shadow-xl aspect-[4/5] flex flex-col justify-between p-6 transition-all hover:-translate-y-2 hover:shadow-2xl">
                             {/* Background Gradient */}
                             <div className={`absolute inset-0 bg-gradient-to-br ${course.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}/>
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                            
                             <div className="relative z-10">
                                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
                                     {course.image === 'shield' && <Shield className="h-6 w-6" />}
                                     {course.image === 'code' && <Code className="h-6 w-6" />}
                                     {course.image === 'brain' && <Brain className="h-6 w-6" />}
                                     {course.image === 'cloud' && <Cloud className="h-6 w-6" />}
                                </div>
                                <h3 className="text-2xl font-bold leading-tight">{course.title}</h3>
                                <p className="text-white/80 mt-1 font-medium">{course.provider}</p>
                             </div>

                             <div className="relative z-10 space-y-4">
                                 <div className="flex items-center gap-1 text-sm font-medium text-white/90">
                                     <span>⭐ {course.rating}</span>
                                     <span className="text-white/50">•</span>
                                     <span>{course.students}</span>
                                 </div>
                                 <button className="w-full py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-bold hover:bg-white hover:text-black transition-all">
                                    Start Learning
                                 </button>
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
