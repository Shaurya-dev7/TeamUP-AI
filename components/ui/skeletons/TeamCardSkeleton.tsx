"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function TeamCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200/50 bg-white/80 dark:border-white/5 dark:bg-neutral-900/80 backdrop-blur-xl shadow-lg h-[280px]">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5" />
      
      {/* Banner gradient skeleton */}
      <div className="h-20 w-full bg-gradient-to-r from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700" />
      
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Team icon and title row */}
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        
        {/* Description lines */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        
        {/* Member avatars row */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-neutral-900" />
            ))}
          </div>
          <Skeleton className="h-4 w-16 ml-2" />
        </div>
        
        {/* Roles/tags row */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
