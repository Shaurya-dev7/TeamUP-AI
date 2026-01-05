"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function NotificationSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/5" />
      
      <div className="flex gap-4">
        {/* Icon placeholder */}
        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title and timestamp row */}
          <div className="flex justify-between items-start gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-12 shrink-0" />
          </div>
          
          {/* Message lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          {/* Action buttons (optional) */}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
