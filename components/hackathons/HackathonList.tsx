"use client";

import React from 'react';
import { motion } from 'framer-motion';
import HackathonCard from './HackathonCard';
import { HackathonEvent } from '@/lib/hackathons';
import { Loader2 } from 'lucide-react';
import { HackathonCardSkeleton } from '@/components/ui/skeletons';

interface HackathonListProps {
  hackathons: HackathonEvent[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  userId: string | null;
  isProfileComplete: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HackathonList({ 
    hackathons, 
    loading, 
    hasMore, 
    onLoadMore, 
    userId, 
    isProfileComplete 
}: HackathonListProps) {
  
  return (
    <div className="space-y-8">
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid gap-6 md:grid-cols-3 xl:grid-cols-4"
      >
        {hackathons.map((hackathon) => (
          <motion.div key={hackathon.id} variants={item} className="h-[400px]">
             <HackathonCard 
                 hackathon={hackathon}
                 userId={userId}
                 isProfileComplete={isProfileComplete}
             />
          </motion.div>
        ))}
        
        {loading && (
          [1,2,3,4].map(i => (
             <HackathonCardSkeleton key={`skeleton-${i}`} />
          ))
        )}
      </motion.div>

      {/* Load More / Infinite Scroll Trigger */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-8">
             <button 
                onClick={onLoadMore}
                className="px-6 py-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold hover:bg-yellow-400 hover:text-black transition-colors flex items-center gap-2"
             >
                Load More Hackathons
             </button>
        </div>
      )}
      
      {!hasMore && hackathons.length > 0 && (
         <div className="text-center py-8 text-neutral-400 text-sm font-medium">
             You've reached the end of the list.
         </div>
      )}

      {!loading && hackathons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                <p>No hackathons found matching your criteria.</p>
          </div>
      )}
    </div>
  );
}
