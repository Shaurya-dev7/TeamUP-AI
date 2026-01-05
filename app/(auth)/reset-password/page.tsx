"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessionValid(true);
      } else {
        setSessionValid(false);
      }
    }
    checkSession();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      toast.error(updateError.message);
      return;
    }

    toast.success("Password updated successfully!");
    setLoading(false);

    // Redirect to dashboard
    router.push("/");
    router.refresh();
  }

  // Loading state while checking session
  if (sessionValid === null) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-neutral-500"
        >
          Verifying reset link...
        </motion.div>
      </div>
    );
  }

  // Invalid/expired session
  if (!sessionValid) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white/80 p-8 shadow-2xl backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/80 sm:p-10"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400 text-3xl shadow-lg shadow-red-400/20">
              ⏰
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Link Expired
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              This password reset link has expired or is invalid.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/forgot-password"
              className="block w-full rounded-xl bg-neutral-900 py-3.5 text-center text-sm font-bold text-white shadow-lg transition-all hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Request New Reset Link
            </Link>
            <Link
              href="/login"
              className="block w-full rounded-xl border-2 border-neutral-200 bg-white py-3 text-center text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Valid session - show password reset form
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
            🔑
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Set New Password
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Choose a strong password for your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              New Password
            </label>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoFocus
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
            />
            <p className="text-xs text-neutral-400">Minimum 8 characters</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Confirm Password
            </label>
            <input
              className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
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
                "Updating..."
              ) : (
                <>
                  Update Password{" "}
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
