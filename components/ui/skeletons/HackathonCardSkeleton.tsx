"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function HackathonCardSkeleton() {
  return (
    <div className="relative h-[400px] w-full rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 z-10" />
      
      {/* Cover image placeholder */}
      <div className="relative h-48 w-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700">
        {/* Badge placeholders */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        {/* Logo placeholder */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <Skeleton className="h-6 w-3/4" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        
        {/* Info row - date/prize */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Action button */}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
