"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronsUpDown, Loader2, Search, MapPin, University } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type CollegeSelection = {
  id: string | null;
  name: string;
  isManual: boolean;
};

interface CollegeAutocompleteProps {
  value: CollegeSelection | null;
  onChange: (selection: CollegeSelection | null) => void;
  className?: string;
}

interface College {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  state: string | null;
}

export default function CollegeAutocomplete({ value, onChange, className }: CollegeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Initialize query from value if present
  useEffect(() => {
    if (value) {
      setQuery(value.name);
      setIsManualMode(value.isManual);
    }
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        // If we closed without selecting and input doesn't match current value, revert
        if (value && query !== value.name) {
             setQuery(value.name);
        } else if (!value && query) {
            // Should we clear or keep? Let's keep for manual entry potential, 
            // but if they didn't explicitly select, maybe we shouldn't force it.
            // For now, if they click away, we assume they might want to come back.
            // But strict UX says either select or clear.
            // Let's reset to last known good value.
            // @ts-ignore
            setQuery(value?.name || "");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, query]);

  // Debounced search
  useEffect(() => {
    if (!open) return; // Don't search if not open (e.g. just viewing)
    
    // If we are just editing an existing selection, allow typing but wait for debounce
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // @ts-ignore
        const { data, error } = await supabase.rpc('search_colleges', {
          search_text: query
        });

        if (error) {
          console.error("Error searching colleges:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error("Failed to search:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, supabase, open]);

  const handleSelect = (college: College) => {
    onChange({
      id: college.id,
      name: college.name,
      isManual: false
    });
    setQuery(college.name);
    setOpen(false);
    setIsManualMode(false);
    
    // Boost popularity in background
    // @ts-ignore
    supabase.rpc('boost_college_popularity', { c_id: college.id }).then(({ error }) => {
        if (error) console.error("Error boosting popularity:", error);
    });
  };

  const handleManualSelect = () => {
    if (!query.trim()) return;
    onChange({
      id: null,
      name: query.trim(),
      isManual: true
    });
    setOpen(false);
    setIsManualMode(true);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setIsManualMode(false);
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className={`
            relative flex items-center w-full rounded-xl bg-neutral-100 dark:bg-neutral-900 border-2 transition-all
            ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-transparent"}
            ${!open && value ? (value.isManual ? "border-yellow-500/50" : "border-green-500/50") : ""}
        `}
      >
        <div className="pl-4 text-neutral-400">
           {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <University className="w-5 h-5"/>}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent border-none px-3 py-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none font-medium"
          placeholder="Start typing your college name..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null); // Clear selection on edit
          }}
          onFocus={() => setOpen(true)}
        />

        {value && !open && (
           <div className="absolute right-3 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  value.isManual 
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                  {value.isManual ? "Manual" : "Verified"}
              </span>
              <button onClick={clearSelection} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full">
                  <span className="sr-only">Clear</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
           </div>
        )}
      </div>

      <AnimatePresence>
        {open && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden max-h-[300px] overflow-y-auto"
          >
            {results.length > 0 ? (
              <ul className="py-2">
                {results.map((college) => (
                  <li key={college.id}>
                    <button
                      onClick={() => handleSelect(college)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-start gap-3 group"
                    >
                      <div className="mt-1 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg group-hover:bg-white dark:group-hover:bg-black transition-colors">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            {college.name}
                            {college.short_name && <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.5 rounded">({college.short_name})</span>}
                        </div>
                        <div className="text-sm text-neutral-500">
                           {college.city}, {college.state}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                
                <div className="border-t border-neutral-100 dark:border-neutral-800 my-1 mx-4" />
              </ul>
            ) : !loading ? (
                <div className="p-4 text-center text-neutral-500 text-sm">
                    No colleges found matching "{query}"
                </div>
            ) : null}

            {!loading && (
                <button
                    onClick={handleManualSelect}
                    className="w-full text-left px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors flex items-center gap-3 text-yellow-700 dark:text-yellow-500 font-medium"
                >
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <ChevronsUpDown className="w-4 h-4" />
                    </div>
                    <div>
                        Use "{query}"
                        <span className="block text-xs opacity-75 font-normal">
                            Not in list? Add it manually.
                        </span>
                    </div>
                </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
