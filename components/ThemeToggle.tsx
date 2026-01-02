"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  // Mount state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or nothing to match hydration
    return (
        <button className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 opacity-50 cursor-wait">
           <span className="size-4 rounded-full bg-neutral-200 dark:bg-neutral-800" />
           Loading
        </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 transition-all"
      aria-label="Toggle theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
         <Moon className="size-4 text-yellow-500 fill-yellow-500/20" />
      ) : (
         <Sun className="size-4 text-orange-500 fill-orange-500/20" />
      )}
      {isDark ? "Dark" : "Light"}
    </button>
  );
}
