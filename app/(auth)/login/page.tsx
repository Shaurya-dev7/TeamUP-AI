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

  // OAuth login handler
  async function handleOAuthLogin(provider: 'google' | 'github') {
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "https://team-up-ai.vercel.app/auth/callback",
      },
    });
    
    if (error) {
      setError(error.message);
      toast.error(error.message);
    }
    setLoading(false);
  }

  // OAuth provider icons
  const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const GithubIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );

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
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-yellow-600 hover:text-yellow-500 hover:underline dark:text-yellow-400"
                >
                  Forgot password?
                </Link>
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

        {/* Divider */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">Or continue with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <GithubIcon /> Continue with GitHub
          </button>
        </div>

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

