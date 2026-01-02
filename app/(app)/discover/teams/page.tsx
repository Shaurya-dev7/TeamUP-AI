"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Search, Plus, Users, Loader2 } from "lucide-react";
import TeamCard from "@/components/teams/TeamCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface Team {
  id: number;
  name: string;
  goal: string | null;
  is_private: boolean;
  max_members: number;
  member_count: number;
  roles_needed: string[];
}

export default function TeamsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<'explore' | 'my-teams'>('explore');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data.session?.user?.id || null);
    };
    fetchSession();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

        let url = "";

        if (activeTab === 'my-teams') {
          if (!session) {
            setTeams([]);
            setLoading(false);
            return;
          }
          url = `/api/teams/mine`;
        } else {
          const params = new URLSearchParams();
          if (searchQuery.trim()) params.set("search", searchQuery.trim());
          params.set("limit", "50");
          url = `/api/teams?${params.toString()}`;
        }

        const response = await fetch(url, { headers });

        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search ONLY for explore tab
    if (activeTab === 'explore') {
      const timeout = setTimeout(fetchTeams, searchQuery ? 300 : 0);
      return () => clearTimeout(timeout);
    } else {
      fetchTeams();
    }
  }, [searchQuery, activeTab]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Teams
          </h1>
          <p className="mt-1 text-neutral-500">
            Find teammates for your next hackathon
          </p>
        </div>
        <Link
          href="/discover/teams/create"
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-neutral-900 shadow-lg shadow-yellow-400/25 transition-all hover:bg-yellow-500 hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Create Team
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex space-x-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800 w-fit">
        <button
          onClick={() => setActiveTab('explore')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'explore'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => {
            if (!userId) {
               // Optional: redirect to login or show toast
               router.push("/login");
               return;
            }
            setActiveTab('my-teams');
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            activeTab === 'my-teams'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          My Teams
        </button>
      </div>

      {/* Search (Only for Explore) */}
      {activeTab === 'explore' && (
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team name or ID (e.g., 100001)..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-neutral-900 placeholder:text-neutral-400 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : teams.length > 0 ? (
        <motion.div
          key={activeTab} // Force re-render on tab change for animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {teams.map((team) => (
            <TeamCard key={team.id} {...team} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Users className="h-10 w-10 text-neutral-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">
            {activeTab === 'my-teams' ? "No teams joined" : (searchQuery ? "No teams found" : "No teams yet")}
          </h3>
          <p className="mb-6 max-w-sm text-neutral-500">
            {activeTab === 'my-teams' 
              ? "You haven't joined any teams yet. Create one or apply to open positions!"
              : (searchQuery 
                  ? `No teams matching "${searchQuery}". Try a different search term.` 
                  : "Be the first to create a team and find your hackathon squad!")}
          </p>
          {activeTab === 'my-teams' && (
            <Link
              href="/discover/teams/create"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-6 py-3 font-bold text-white transition-colors hover:bg-black dark:bg-white dark:text-black"
            >
              <Plus className="h-4 w-4" />
              Create Your First Team
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
