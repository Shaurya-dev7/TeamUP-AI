"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Sign up with Supabase Auth
    // We send NO metadata to ensuring the 'handle_new_user' trigger
    // does not attempt to create a profile row.
    // Profile creation is strictly deferred to the /create-profile step after verification.
    
    // We explicitly set the redirect URL to our callback route to ensure proper session exchange.
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    console.log("Signup Result:", { user: data?.user, session: data?.session, error: authError });

    if (data?.session) {
      // Auto-login happened (Auto Confirm is likely ON in Supabase)
      // In this case, we should just redirect to create-profile directly
      console.log("Auto-login detected. Redirecting to create-profile...");
      router.push("/create-profile");
      return;
    }

    setLoading(false);

    if (authError) {
      const msg = authError.message || 'Failed to sign up';
      setError(msg);
      toast.error(msg);
      return;
    }

    // SUCCESS - Show verify message
    setSuccess(true);
    toast.success("Account created! Check your email.");
  }

  if (success) {
    return (
      <div className="flex min-h-[85vh] w-full items-center justify-center p-4">
         <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-green-200 bg-green-50/80 p-8 shadow-2xl backdrop-blur-xl dark:border-green-900/50 dark:bg-green-950/30 sm:p-10 text-center"
        >
          <div className="mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl shadow-lg ring-4 ring-green-50 dark:bg-green-900/50 dark:ring-green-900/30">
            ✉️
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-white mb-4">Check your inbox!</h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
            A confirmation email has been sent to <span className="font-semibold text-neutral-900 dark:text-white">{email}</span>. Please verify your email address to activate your account.
          </p>
          
          <Link 
            href="/login"
            className="block w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    )
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

