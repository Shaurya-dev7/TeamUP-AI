
"use client";

import React from 'react';
import { Calendar, Trophy, MapPin, ExternalLink, Lock, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { HackathonEvent } from '@/lib/hackathons';

interface HackathonCardProps {
  hackathon: HackathonEvent;
  userId: string | null;
  isProfileComplete: boolean;
  onApplyBlocked?: (reason: 'logged_out' | 'incomplete_profile') => void;
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Tech blue
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop", // Circuit
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop", // AI Brain
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop", // Retro PC
  "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2008&auto=format&fit=crop", // Grid
  "https://images.unsplash.com/photo-1639322537228-ad7117a7a6bb?q=80&w=2000&auto=format&fit=crop", // 3D Shapes
];

function getFallbackImage(id: string) {
    if (!id) return FALLBACK_IMAGES[0];
    const charCode = id.charCodeAt(0) || 0;
    return FALLBACK_IMAGES[charCode % FALLBACK_IMAGES.length];
}

export default function HackathonCard({ hackathon, userId, isProfileComplete, onApplyBlocked }: HackathonCardProps) {
  const router = useRouter();
  const hasViewedRef = React.useRef(false);

  // Analytics: Track view on mount (once per session/mount)
  React.useEffect(() => {
      if (!hasViewedRef.current) {
          hasViewedRef.current = true;
          const trackView = async () => {
             try {
                await fetch('/api/hackathons/analytics', {
                    method: 'POST',
                    body: JSON.stringify({ type: 'view', id: hackathon.id }),
                    headers: { 'Content-Type': 'application/json' }
                });
             } catch (e) {}
          };
          trackView();
      }
  }, [hackathon.id]);

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Sign in to apply");
      onApplyBlocked?.('logged_out');
      router.push('/login'); 
      return;
    }

    if (!isProfileComplete) {
      toast.error("Complete profile to apply");
      onApplyBlocked?.('incomplete_profile');
      router.push('/create-profile'); 
      return;
    }

    if (hackathon.redirect_url) {
      try {
          await fetch('/api/hackathons/analytics', {
                method: 'POST',
                body: JSON.stringify({ type: 'click', id: hackathon.id }),
                headers: { 'Content-Type': 'application/json' }
          });
      } catch (e) { /* ignore */ }
      window.open(hackathon.redirect_url, '_blank');
    } else {
        toast.error("No application link available");
    }
  };

  const formatDate = (dateString: string) => {
      try {
          return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } catch (e) {
          return dateString;
      }
  };

  const backgroundImage = hackathon.logo || getFallbackImage(hackathon.id);

  return (
    <div className="group relative cursor-pointer h-full flex flex-col">
      {/* Dynamic Border Gradient on Hover */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-yellow-400 group-hover:via-orange-500 group-hover:to-red-500 rounded-[24px] opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm" />
      
      <div className="relative overflow-hidden rounded-[22px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 h-full flex flex-col shadow-sm transition-all duration-300 group-hover:shadow-2xl dark:group-hover:shadow-neutral-900/50">
        
        {/* Image Header */}
        <div className="h-40 w-full relative overflow-hidden">
           <img 
             src={backgroundImage} 
             alt={hackathon.title} 
             loading="lazy"
             className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
           />
           {/* Gradient Overlay for Text Readability */}
           <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />

           {/* Badges Top Right (Includes LIVE indicator) */}
           <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                {/* LIVE INDICATOR */}
                {/* Logic: If strictly live (start <= now < end) */}
                {(new Date() >= new Date(hackathon.start_date) && new Date() < new Date(hackathon.end_date)) && (
                    <div className="bg-red-600 text-white px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-lg shadow-red-500/40 uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white block" /> LIVE
                    </div>
                )}
                
                {hackathon.is_featured && (
                     <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-lg shadow-yellow-400/20 uppercase tracking-wider">
                        Featured
                     </div>
                )}

                <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-neutral-900 dark:text-white flex items-center gap-1 shadow-sm border border-neutral-200/50 dark:border-white/10">
                     <Calendar className="w-3 h-3 text-neutral-500" />
                     {formatDate(hackathon.start_date)}
                </div>
           </div>

           {/* Organizer Logo/Name Overlay */}
           <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between">
                <p className="text-xs font-bold text-white/90 uppercase tracking-wide flex items-center gap-1.5 drop-shadow-md">
                     {hackathon.organizer}
                </p>
                {/* Mode Badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border shadow-sm
                    ${hackathon.mode?.toLowerCase().includes('online') 
                        ? 'bg-emerald-500/80 border-emerald-400/30 text-white' 
                        : 'bg-indigo-500/80 border-indigo-400/30 text-white'}
                `}>
                    {hackathon.mode || 'Online'}
                </span>
           </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 flex-1">
           {/* Title */}
           <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-yellow-500 group-hover:to-orange-600 transition-all">
               {hackathon.title}
           </h3>

           {/* Metrics Grid */}
           <div className="grid grid-cols-2 gap-3 mt-auto">
               <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">Prize Pool</p>
                    <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold text-sm truncate">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        <span title={hackathon.prize_text}>{hackathon.prize_text || 'TBD'}</span>
                    </div>
               </div>
               
               <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase mb-0.5">Location</p>
                    <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-bold text-sm truncate">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span title={hackathon.location || 'Remote'}>{hackathon.location || 'Remote'}</span>
                    </div>
               </div>
           </div>

           {/* Footer Action */}
           <div className="pt-2">
                <button 
                    onClick={handleApplyClick}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden
                        ${!userId 
                            ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700" 
                            : !isProfileComplete
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500"
                                : "bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        }
                    `}
                >
                    {!userId && (
                        <>
                            <UserPlus className="w-4 h-4" /> Sign in
                        </>
                    )}
                    {userId && !isProfileComplete && (
                        <>
                            <Lock className="w-4 h-4" /> Setup Profile
                        </>
                    )}
                    {userId && isProfileComplete && (
                        <>
                            Apply Now <ExternalLink className="w-4 h-4" />
                        </>
                    )}
                </button>
           </div>
        </div>
      </div>
    </div>
  );
}
