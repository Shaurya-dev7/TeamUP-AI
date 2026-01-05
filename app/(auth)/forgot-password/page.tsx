"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://team-up-ai.vercel.app/auth/reset-password",
    });

    // Always show success message to prevent user enumeration
    setLoading(false);
    setSubmitted(true);

    if (error) {
      // Log error for debugging but don't expose to user
      console.error("[Forgot Password] Error:", error.message);
    }

    toast.success("If an account exists, a reset link has been sent.");
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
            🔐
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {!submitted ? (
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

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-neutral-800 disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    Send Reset Link{" "}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </>
                )}
              </span>
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
              <p className="font-semibold">Check your inbox!</p>
              <p className="mt-1 text-xs opacity-80">
                If an account exists for {email}, you&apos;ll receive a password
                reset link shortly.
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full rounded-xl border-2 border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Try a different email
            </button>
          </motion.div>
        )}

        <div className="mt-8 text-center text-sm text-neutral-500">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-yellow-600 hover:text-yellow-500 hover:underline dark:text-yellow-400"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
