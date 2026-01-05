"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AnnouncementTicker() {
  return (
    <div className="bg-red-600 overflow-hidden py-2 relative z-40">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
      <div className="flex select-none gap-10 overflow-hidden w-full">
        <motion.div
          animate={{ x: "-50%" }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20,
          }}
          className="flex min-w-full shrink-0 items-center justify-around gap-10 whitespace-nowrap"
        >
          {[...Array(4)].map((_, i) => (
            <Link key={i} href="/discover" className="flex items-center gap-4 group">
              <span className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live: Global AI Hackathon 2026
              </span>
              <span className="text-xs font-medium text-white/80 group-hover:text-white group-hover:underline flex items-center gap-1 transition-all">
                Register Now <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </motion.div>
        
        {/* Duplicate for seamless loop */}
        <motion.div
          animate={{ x: "-50%" }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20,
          }}
          className="flex min-w-full shrink-0 items-center justify-around gap-10 whitespace-nowrap"
        >
           {[...Array(4)].map((_, i) => (
            <Link key={i} href="/discover" className="flex items-center gap-4 group">
              <span className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live: Global AI Hackathon 2026
              </span>
              <span className="text-xs font-medium text-white/80 group-hover:text-white group-hover:underline flex items-center gap-1 transition-all">
                Register Now <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
