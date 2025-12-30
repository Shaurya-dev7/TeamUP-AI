"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, ChevronDown, Check, Star, 
  Clock, Award, BookOpen, PlayCircle, Zap, 
  BarChart, Globe,  Monitor, Cloud, Shield
} from "lucide-react";
import Link from "next/link";
 

// --- Mock Data ---
const categories = [
  { id: 'all', label: 'All Fields' },
  { id: 'tech', label: 'Technology' },
  { id: 'design', label: 'Design' },
  { id: 'business', label: 'Business' },
  { id: 'marketing', label: 'Marketing' },
];

const sortOptions = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'rating', label: 'Highest Rated' },
];

const courses = [
  {
    id: 1,
    title: "Advanced React Patterns",
    instructor: "Sarah Drasner",
    category: "tech",
    rating: 4.9,
    students: 12500,
    duration: "6h 30m",
    lectures: 42,
    level: "Advanced",
    price: 0,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
    gradient: "from-cyan-500 to-blue-500",
    tags: ["React", "Frontend", "Engineering"],
    isTrending: true,
    isNew: false
  },
  {
    id: 2,
    title: "UI/UX Design Masterclass",
    instructor: "Gary Simon",
    category: "design",
    rating: 4.8,
    students: 8400,
    duration: "12h 15m",
    lectures: 65,
    level: "Beginner",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?q=80&w=2070&auto=format&fit=crop",
    gradient: "from-purple-500 to-pink-500",
    tags: ["Figma", "Design", "Prototyping"],
    isTrending: true,
    isNew: false
  },
  {
    id: 3,
    title: "Full-Stack Next.js 14",
    instructor: "Lee Robinson",
    category: "tech",
    rating: 4.9,
    students: 15600,
    duration: "10h 45m",
    lectures: 58,
    level: "Intermediate",
    price: 0,
    image: "https://images.unsplash.com/photo-1618477247222-ac5912453634?q=80&w=2070&auto=format&fit=crop",
    gradient: "from-gray-900 to-black",
    tags: ["Next.js", "Vercel", "Fullstack"],
    isTrending: true,
    isNew: true
  },
  {
    id: 4,
    title: "Digital Marketing Strategy",
    instructor: "Seth Godin",
    category: "marketing",
    rating: 4.7,
    students: 6200,
    duration: "5h 20m",
    lectures: 30,
    level: "All Levels",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1557838923-2985c318be48?q=80&w=2070&auto=format&fit=crop",
    gradient: "from-orange-500 to-red-500",
    tags: ["Marketing", "SEO", "Growth"],
    isTrending: false,
    isNew: true
  },
  {
    id: 5,
    title: "Technical Interview Prep",
    instructor: "Clément Mihailescu",
    category: "tech",
    rating: 4.9,
    students: 22000,
    duration: "15h 00m",
    lectures: 100,
    level: "Advanced",
    price: 120,
    image: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2128&auto=format&fit=crop",
    gradient: "from-green-500 to-emerald-600",
    tags: ["Algorithms", "Data Structures", "Interview"],
    isTrending: true,
    isNew: false
  },
  {
    id: 6,
    title: "Cybersecurity Basics",
    instructor: "John Hammond",
    category: "tech",
    rating: 4.6,
    students: 5400,
    duration: "4h 45m",
    lectures: 28,
    level: "Beginner",
    price: 0,
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop",
    gradient: "from-red-600 to-rose-600",
    tags: ["Security", "Hacking", "Network"],
    isTrending: false,
    isNew: true
  },
   {
    id: 7,
    title: "Cloud Architecture AWS",
    instructor: "Stephane Maarek",
    category: "tech",
    rating: 4.8,
    students: 18900,
    duration: "20h 30m",
    lectures: 140,
    level: "Advanced",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
    gradient: "from-yellow-500 to-orange-500",
    tags: ["AWS", "Cloud", "Architecture"],
    isTrending: true,
    isNew: false
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

export default function DiscoverCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter Logic
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    const matchesPrice = !showFreeOnly || course.price === 0;

    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'popular') return b.students - a.students;
    if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const trendingCourses = filteredCourses.filter(c => c.isTrending);
  const newCourses = filteredCourses.filter(c => c.isNew && !c.isTrending); // Avoid dupes in simple view
  // If we filter heavily, 'trending' might be empty, so we just show 'All Results' if specific filters are active
  const isFiltering = searchQuery || selectedCategory !== 'all' || showFreeOnly;


  return (
    <div className="min-h-screen pb-20 pt-10 relative overflow-hidden bg-[#FAFAFA] dark:bg-[#050505]">
      {/* Background */}
      
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
                        Explore thousands of high-quality courses from top instructors.
                        Find the perfect class to advance your career.
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
                                placeholder="Search Python, Design, Marketing..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none py-4 px-3 text-neutral-900 dark:text-white placeholder:text-neutral-500"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>

        {/* --- CONTROLS / FILTERS --- */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-4 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
        >
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                            selectedCategory === cat.id
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-lg shadow-neutral-500/20"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {/* Free Toggle */}
                <button
                    onClick={() => setShowFreeOnly(!showFreeOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                        showFreeOnly
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:text-neutral-400"
                    }`}
                >
                    {showFreeOnly ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full border-2 border-current" />}
                    Free Courses
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    >
                        <BarChart className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortOptions.find(o => o.id === sortBy)?.label}</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                     <AnimatePresence>
                        {isSortOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-50 py-1"
                            >
                                {sortOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => { setSortBy(option.id); setIsSortOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors ${
                                            sortBy === option.id ? "text-blue-600 dark:text-blue-400" : "text-neutral-600 dark:text-neutral-400"
                                        }`}
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

        {/* --- MAIN CONTENT --- */}
        
        {/* If searching or filtering, show simple grid */}
        {isFiltering ? (
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
                    {filteredCourses.map(course => <CourseCard key={course.id} course={course} />)}
                </motion.div>
                {filteredCourses.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-neutral-500 text-lg">No courses found matching your criteria.</p>
                        <button 
                            onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setShowFreeOnly(false); }}
                            className="mt-4 text-blue-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <>
                {/* TRENDING SECTION */}
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
                         {trendingCourses.map(course => <CourseCard key={course.id} course={course} featured />)}
                    </motion.div>
                </div>

                {/* NEW COURSES SECTION */}
                 <div className="space-y-6 pt-10">
                    <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-purple-500 fill-purple-500" />
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">New & Noteworthy</h2>
                    </div>
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                         {/* Show mix of new and remaining courses for demo fullness */}
                         {filteredCourses.slice(0, 8).map(course => <CourseCard key={course.id} course={course} />)}
                    </motion.div>
                </div>
            </>
        )}

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Course Card ---
function CourseCard({ course, featured }: { course: any, featured?: boolean }) {
    return (
        <motion.div 
            variants={itemVariants}
            className="group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Image Cover */}
            <div className="relative h-48 w-full overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10`} />
                <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                    {course.price === 0 && (
                        <span className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                            FREE
                        </span>
                    )}
                    {featured && (
                        <span className="bg-yellow-500/90 backdrop-blur-sm text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-black" /> TRENDING
                        </span>
                    )}
                </div>

                {/* Floating Rating */}
                <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold border border-white/10">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {course.rating}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5 gap-3">
                
                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                    {course.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                            {tag}
                        </span>
                    ))}
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title}
                </h3>
                
                <p className="text-sm font-medium text-neutral-500">
                    by <span className="text-neutral-700 dark:text-neutral-300">{course.instructor}</span>
                </p>

                {/* Metadata Row */}
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {course.duration}
                    </div>
                     <div className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" /> {course.lectures} lectures
                    </div>
                </div>

                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div>
                         {course.price === 0 ? (
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">Free</span>
                        ) : (
                            <span className="text-lg font-bold text-neutral-900 dark:text-white">${course.price}</span>
                        )}
                    </div>
                    
                    <button className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all shadow-md">
                        Enroll
                    </button>
                </div>

            </div>
        </motion.div>
    );
}
