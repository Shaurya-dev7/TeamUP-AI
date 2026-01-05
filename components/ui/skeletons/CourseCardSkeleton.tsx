"use client";

import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function CourseCardSkeleton() {
  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/5 z-10" />
      
      {/* Cover gradient placeholder */}
      <div className="relative h-32 w-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700">
        {/* Badge placeholder */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        {/* Icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        
        {/* Footer row */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
