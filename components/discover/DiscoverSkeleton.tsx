import React from "react";

export function DiscoverSkeleton() {
    return (
        <div className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white/60 p-6 shadow-sm dark:border-white/5 dark:bg-white/5">
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/5"></div>

            <div className="flex gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="flex-1 space-y-2 pt-2">
                    <div className="h-5 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                    <div className="h-4 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="h-4 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="h-4 w-3/4 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
            </div>

            <div className="flex gap-2 mb-6">
                <div className="h-6 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="h-6 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="h-6 w-16 rounded-lg bg-neutral-200 dark:bg-neutral-800"></div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-neutral-200/50 dark:border-white/5">
                <div className="flex-1 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="h-10 w-12 rounded-xl bg-neutral-200 dark:bg-neutral-800"></div>
            </div>
        </div>
    );
}
