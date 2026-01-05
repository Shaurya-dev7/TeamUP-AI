
"use client";

import React from 'react';
import { ArrowRight, Trophy, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import HackathonCard from './HackathonCard';
import { HackathonEvent } from '@/lib/hackathons';
import { HackathonCardSkeleton } from '@/components/ui/skeletons';

interface HackathonSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  icon: any;
  category: 'trending' | 'live' | 'upcoming';
  hackathons: HackathonEvent[];
  userId: string | null;
  isProfileComplete: boolean;
  loading?: boolean;
}

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

export default function HackathonSection({ 
    title, 
    subtitle, 
    icon: Icon, 
    category,
    hackathons, 
    userId, 
    isProfileComplete,
    loading 
}: HackathonSectionProps) {

  // Don't render empty sections if not loading
  // if (!loading && hackathons.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between px-2">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <Icon className="h-6 w-6 text-yellow-500" />
                {title}
           </h2>
           {subtitle && <p className="mt-2 text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
        </div>
        <Link 
            href={`/hackathons/${category}`} 
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 group"
        >
            See all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-6 md:grid-cols-3 xl:grid-cols-4" // Use 4 cols for wide screens
      >
          {loading ? (
             [1,2,3,4].map(i => (
                 <HackathonCardSkeleton key={i} />
             ))
          ) : (
            hackathons.map((hackathon) => (
                <motion.div key={hackathon.id} variants={item} className="h-[400px]">
                    <HackathonCard 
                        hackathon={hackathon}
                        userId={userId}
                        isProfileComplete={isProfileComplete}
                    />
                </motion.div>
            ))
          )}
      </motion.div>
    </div>
  );
}
