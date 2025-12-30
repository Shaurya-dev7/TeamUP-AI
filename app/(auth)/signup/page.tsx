"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

function normalizeUsername(input: string) {
  return input.trim().toLowerCase();
}

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = normalizeUsername(username);

    // Validate username format on the client
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(cleanUsername)) {
      setError('Username must be 3–20 chars, lowercase letters, numbers, or underscore.');
      setLoading(false);
      return;
    }

    // Check username uniqueness (optimistic check)
    try {
      const { data: existing } = await supabase.from('profiles').select('id').eq('username', cleanUsername).maybeSingle();
      if (existing) {
        setError('Username already taken. Please pick another.');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Username pre-check failed, proceeding with signup:', e);
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: displayName.trim() || null,
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || 'Failed to sign up');
      return;
    }

    // Attempt profile creation manually if needed (same logic as before)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let uid = session?.user?.id ?? null;
      if (!uid) {
        const { data: userRes } = await supabase.auth.getUser();
        uid = userRes?.user?.id ?? uid;
      }

      if (uid) {
         const { data: existing } = await supabase.from("profiles").select("id").eq("username", cleanUsername).maybeSingle();
        if (existing) {
           setError("Username already taken. Please pick another.");
           return;
        }

        const { error: profileErr } = await supabase.from("profiles").upsert([
          { id: uid, username: cleanUsername, display_name: displayName.trim() || null },
        ] as any);
        if (profileErr) {
          console.warn("profile upsert error", profileErr.message);
        }
      }
    } catch (e) {
      console.warn("Could not create profile automatically", e);
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[85vh] w-full items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80 sm:p-10"
      >
        <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 text-3xl shadow-lg shadow-yellow-400/20 text-white">
                👋
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Create Account</h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Join the community and start collaborating.
            </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Display Name
                </label>
                <input
                className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                placeholder="John Doe"
                />
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Username
                </label>
                <input
                className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                pattern="^[a-z0-9_]{3,20}$"
                placeholder="johndoe"
                required
                />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Email Address
            </label>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Password
            </label>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            <p className="text-[10px] text-neutral-400">Must be at least 6 characters</p>
          </div>

          {error && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-yellow-400 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-yellow-400/20 transition-all hover:bg-yellow-300 disabled:opacity-70"
          >
              {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-neutral-900 hover:underline dark:text-white">
            Log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
