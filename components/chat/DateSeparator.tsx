import React from 'react';

interface DateSeparatorProps {
    date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return "Today";
        } else if (d.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return d.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    return (
        <div className="flex justify-center my-4 opacity-70">
            <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {formatDate(date)}
            </span>
        </div>
    );
}
