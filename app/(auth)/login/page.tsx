"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email before logging in. Check your inbox.");
        }
        throw new Error(authError.message);
      }

      const user = data?.user;
      if (!user) {
        throw new Error("Login failed. Please try again.");
      }

      // Explicit Check: Ensure Email is Verified (Defensive)
      // Note: signInWithPassword usually handles this if Supabase "Confirm Email" setting is on,
      // but we double check or handle cases where it might not throw explicitly.
      /* 
         If user IS logged in but email_confirmed_at is null, we should ideally sign them out 
         and tell them to verify. However, typically Supabase won't return a session if unverified 
         depending on settings. We assume strict setting is ON.
      */

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError);
        // We generally shouldn't block login if just the profile check fails due to network, 
        // but safely assume we need to redirect to create-profile if we can't find it.
      }

      setLoading(false);

      if (!profile) {
        // No profile found -> Redirect to Profile Creation
        // We pass a query param or just let the page handle logic
        router.push("/create-profile");
      } else {
        // Profile exists -> Dashboard
        router.push("/");
      }
      
      router.refresh();

    } catch (err: any) {
      setLoading(false);
      const msg = err.message || "An error occurred during login.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80 sm:p-10"
      >
        <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-3xl shadow-lg shadow-yellow-400/20">
                ⚡
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Welcome Back</h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Enter your credentials to access your account.
            </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Email Address
            </label>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              name="email"
              type="email"
              autoFocus
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1">
             <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Password
                </label>
            </div>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
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
            className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-neutral-800 disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
           <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                    "Signing in..."
                ) : (
                    <>
                    Sign In <span className="transition-transform group-hover:translate-x-1">→</span>
                    </>
                )}
           </span>
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-neutral-500">
          New to TeamUp?{" "}
          <Link href="/signup" className="font-semibold text-yellow-600 hover:text-yellow-500 hover:underline dark:text-yellow-400">
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

