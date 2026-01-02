"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Globe, HeartPulse, Gamepad2, Rocket } from "lucide-react";
import Link from "next/link";

const slides = [
  {
    id: 1,
    theme: "AI & Machine Learning",
    title: "Build the Brain of Tomorrow",
    description: "Join teams pushing the boundaries of Neural Networks, LLMs, and Computer Vision.",
    icon: <Sparkles className="w-12 h-12 text-white" />,
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80", // AI/Brain abstract
    bg: "bg-black",
  },
  {
    id: 2,
    theme: "FinTech Revolution",
    title: "Decimal Points Matter",
    description: "Disrupt banking, crypto, and decentralized finance with secure, scalable solutions.",
    icon: <Zap className="w-12 h-12 text-yellow-400" />,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80", // Data/Graph
    bg: "bg-black",
  },
  {
    id: 3,
    theme: "Sustainability & Eco",
    title: "Code for the Planet",
    description: "Smart grids, carbon tracking, and green tech. Hack for a sustainable future.",
    icon: <Globe className="w-12 h-12 text-emerald-400" />,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1600&q=80", // Nature/Eco
    bg: "bg-black",
  },
  {
    id: 4,
    theme: "HealthTech",
    title: "Saving Lives with Code",
    description: "From telemedicine to AI diagnostics. Your code can improve global healthcare.",
    icon: <HeartPulse className="w-12 h-12 text-rose-400" />,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80", // Medical/Tech
    bg: "bg-black",
  },
  {
    id: 5,
    theme: "Gaming & VR",
    title: "Level Up Reality",
    description: "Create immersive worlds, indie hits, and next-gen VR experiences.",
    icon: <Gamepad2 className="w-12 h-12 text-purple-400" />,
    image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1600&q=80", // Gaming/VR
    bg: "bg-black",
  },
  {
    id: 6,
    theme: "Space & Aerospace",
    title: "To Infinity & Beyond",
    description: "Rocket telemetry, satellite comms, and orbital mechanics simulation.",
    icon: <Rocket className="w-12 h-12 text-blue-400" />,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80", // Space
    bg: "bg-black",
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8500); // 8.5 seconds (Much slower as requested)
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[600px] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 group bg-neutral-900">
      {slides.map((slide, index) => {
        const isActive = index === current;
        return (
          <motion.div
            key={slide.id}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 10 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }} // Smoother cross-fade
            style={{ pointerEvents: isActive ? "auto" : "none" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Scale Effect */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <motion.img 
                    src={slide.image} 
                    alt={slide.title}
                    animate={{ scale: isActive ? 1.0 : 1.1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90" />
            
            {/* Content */}
            <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end">
                <div className="relative z-10 max-w-2xl">
                    <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-bold border border-white/20 text-white w-fit"
                    >
                        {slide.icon} <span className="uppercase tracking-wider">{slide.theme}</span>
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-white leading-[1.1] drop-shadow-2xl"
                    >
                    {slide.title}
                    </motion.h2>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className="text-xl text-neutral-200 mb-10 max-w-xl leading-relaxed font-medium drop-shadow-md"
                    >
                    {slide.description}
                    </motion.p>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="flex gap-4"
                    >
                        <Link href="/discover" className="px-8 py-4 bg-yellow-400 text-neutral-950 rounded-xl font-bold text-lg transition-all hover:bg-yellow-300 hover:scale-105 active:scale-95 shadow-xl shadow-yellow-400/20 flex items-center gap-2">
                            Explore Hackathons <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </div>
          </motion.div>
        );
      })}
          
      {/* Progress Indicators (Always on top) */}
      <div className="absolute bottom-10 right-10 flex gap-3 z-50">
        {slides.map((s, idx) => (
            <button 
                key={s.id}
                onClick={() => setCurrent(idx)}
                className={`transition-all duration-500 rounded-full border border-white/30 backdrop-blur-sm ${current === idx ? "w-12 h-3 bg-yellow-400 border-yellow-400" : "w-3 h-3 bg-white/20 hover:bg-white/40"}`}
            />
        ))}
      </div>
    </div>
  );
}
