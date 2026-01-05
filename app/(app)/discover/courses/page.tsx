"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, ChevronDown, Check, Star, 
  Clock, Award, BookOpen, PlayCircle, Zap, 
  BarChart, Globe,  Monitor, Cloud, Shield, Loader2, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { getNewCourses, getTrendingCourses, getAllCourses, trackCourseClick } from "./actions";
import { CourseCardSkeleton } from "@/components/ui/skeletons";

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

export default function DiscoverCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [newCourses, setNewCourses] = useState<any[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  
  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [news, trendings, all] = await Promise.all([
            getNewCourses(),
            getTrendingCourses(),
            getAllCourses(1, 100)
        ]);
        setNewCourses(news);
        setTrendingCourses(trendings);
        setAllCourses(all.data);
      } catch (e) {
        console.error("Failed to fetch courses", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);


  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      false;
    
    // Note: Category in DB is currently null/mixed, so simple filter if we had it.
    // For now, we rely on search.
    return matchesSearch;
  });

  const isFiltering = searchQuery !== "";

  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden bg-[#FAFAFA] dark:bg-[#050505]">
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* --- HEADER & HERO --- */}
        <div className="space-y-8">
            <Link 
                href="/discover" 
                className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
            >
                <ChevronDown className="rotate-90 w-4 h-4" /> Back to Discover
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4 max-w-2xl">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white"
                    >
                        Master New <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Skills</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-neutral-600 dark:text-neutral-400"
                    >
                        Explore thousands of courses from DIKSHA.
                        Straight from the Government of India.
                    </motion.p>
                </div>

                {/* --- SEARCH BAR --- */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full md:w-auto flex-1 max-w-md"
                >
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                        <div className="relative flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm focus-within:ring-2 ring-blue-500/50 transition-all overflow-hidden">
                            <Search className="w-5 h-5 ml-4 text-neutral-400" />
                            <input 
                                type="text"
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none py-4 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <CourseCardSkeleton key={i} />
                ))}
            </div>
        ) : isFiltering ? (
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {filteredCourses.length} Result{filteredCourses.length !== 1 && 's'} Found
                </h2>
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                    {filteredCourses.map(course => <CourseCard key={course.course_id} course={course} />)}
                </motion.div>
            </div>
        ) : (
            <>
                {/* TRENDING SECTION */}
                {trendingCourses.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Trending Now</h2>
                        </div>
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                                {trendingCourses.map(course => <CourseCard key={course.course_id} course={course} featured />)}
                        </motion.div>
                    </div>
                )}

                {/* NEW COURSES SECTION */}
                {newCourses.length > 0 && (
                    <div className="space-y-6 pt-10">
                        <div className="flex items-center gap-2">
                            <Star className="w-6 h-6 text-purple-500 fill-purple-500" />
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">New Arrivals</h2>
                        </div>
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                                {newCourses.map(course => <CourseCard key={course.course_id} course={course} />)}
                        </motion.div>
                    </div>
                )}
                
                 {/* ALL COURSES SECTION */}
                 {allCourses.length > 0 && (
                    <div className="space-y-6 pt-10">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-500" />
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Browse All</h2>
                        </div>
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        >
                                {/* Showing remainder of all courses that are NOT new/trending to give variety, or just first batch */}
                                {allCourses.slice(0, 12).map(course => <CourseCard key={course.course_id} course={course} />)}
                        </motion.div>
                    </div>
                )}
            </>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Course Card ---
function CourseCard({ course, featured }: { course: any, featured?: boolean }) {
    const [isTracking, setIsTracking] = useState(false);

    const handleViewCourse = async () => {
        setIsTracking(true);
        try {
            const redirectUrl = await trackCourseClick(course.course_id, "discover_courses");
            window.open(redirectUrl, "_blank");
        } catch (e) {
            console.error("Tracking failed", e);
            // Fallback
            if(course.redirect_url) window.open(course.redirect_url, "_blank");
        } finally {
            setIsTracking(false);
        }
    };


    // Generate a deterministic gradient based on course_id or title
    const gradients = [
        "from-blue-500 to-cyan-400",
        "from-purple-500 to-pink-500",
        "from-emerald-500 to-green-400",
        "from-orange-500 to-amber-400", 
        "from-rose-500 to-red-400",
        "from-indigo-500 to-violet-500"
    ];
    // Simple hash to pick a gradient
    const hash = course.course_id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[hash % gradients.length];

    return (
        <motion.div 
            variants={itemVariants}
            className="group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Minimal Cover - Using vibrant gradient as visual representation if no image */}
            <div className={`relative h-32 w-full overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-105 transition-transform duration-700`}>
                 <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
                 {/* Icon Overlay */}
                 <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
                    <BookOpen className="w-6 h-6" />
                 </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                    <span className="bg-black/20 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                        DIKSHA
                    </span>
                    {featured && (
                        <span className="bg-white/90 backdrop-blur-sm text-yellow-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-yellow-600" /> HOT
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5 gap-3">
                <h3 className="text-md font-bold text-neutral-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {course.title}
                </h3>
                
                {course.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2">
                        {typeof course.description === 'string' ? course.description : "No description available."}
                    </p>
                )}

                <div className="mt-auto pt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{course.language}</span>
                    
                    <button 
                        onClick={handleViewCourse}
                        disabled={isTracking}
                        className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all shadow-md flex items-center gap-2"
                    >
                        {isTracking ? <Loader2 className="w-3 h-3 animate-spin"/> : <ExternalLink className="w-3 h-3" />}
                        View
                    </button>
                </div>

            </div>
        </motion.div>
    );
}
const categories = [
  { id: 'all', label: 'All Fields' },
  { id: 'tech', label: 'Technology' },
  { id: 'design', label: 'Design' },
  { id: 'business', label: 'Business' },
  { id: 'marketing', label: 'Marketing' },
];
