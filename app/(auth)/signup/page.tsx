"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MoveRight, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { SignupSchema } from "@/lib/validators/auth";

export default function SignupPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Validate Input with Zod
    const result = SignupSchema.safeParse({ email, password });
    if (!result.success) {
      setLoading(false);
      const firstError = result.error.issues[0]?.message || "Invalid input";
      setError(firstError);
      return;
    }

    // 2. Sign up with Supabase Auth
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

    if (data?.session) {
      // Auto-login happened (Auto Confirm is likely ON in Supabase)
      // In this case, we should just redirect to create-profile directly
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

  // OAuth signup handler
  async function handleOAuthSignup(provider: 'google' | 'github') {
    setLoading(true);
    setError(null);
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
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
            <div className="mb-6 h-20 w-20 rounded-full overflow-hidden shadow-xl shadow-yellow-400/20">
                <BrandLogo className="w-full h-full" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Create Account</h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Join the community and start collaborating.
            </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
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
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Password
            </label>
            <div className="relative">
                <input
                  className="w-full rounded-xl border-2 border-transparent bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 transition-all placeholder:text-neutral-400 hover:bg-neutral-200/50 focus:border-yellow-400 focus:bg-white focus:outline-none dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-950 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
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

        {/* Divider */}
        <div className="relative mt-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">Or sign up with</span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignup('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <GoogleIcon /> Sign up with Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignup('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <GithubIcon /> Sign up with GitHub
          </button>
        </div>

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

