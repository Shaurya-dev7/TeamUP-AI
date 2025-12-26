"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      setError(authError.message);
      return;
    }

    // Try to create a matching `profiles` row if we can get the user id (session may be null when email confirm is required)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.data?.session?.user?.id ?? null;

      // If no session (email confirm flows), attempt to read `data.user` from the auth response via getUser()
      let uid = userId;
      if (!uid) {
        const { data: userRes } = await supabase.auth.getUser();
        uid = userRes?.data?.user?.id ?? uid;
      }

      if (uid) {
        // Ensure username not taken
        const { data: existing } = await supabase.from("profiles").select("id").eq("username", cleanUsername).maybeSingle();
        if (existing) {
          setError("Username already taken. Please pick another.");
          return;
        }

        const { error: profileErr } = await supabase.from("profiles").upsert([
          { id: uid, username: cleanUsername, display_name: displayName.trim() || null },
        ]);
        if (profileErr) {
          console.warn("profile upsert error", profileErr.message);
        }
      }
    } catch (e) {
      console.warn("Could not create profile automatically", e);
    }

    // Route to home — if email confirmation is required the user will need to confirm first.
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
        <span className="inline-block size-2 rounded-full bg-yellow-500" />
        Create your TeamUp profile
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Sign up</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Pick a unique username to build your network.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Display name (optional)
          </span>
          <input
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Aisha Khan"
            autoComplete="name"
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Username (unique)
          </span>
          <input
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            autoComplete="username"
            pattern="^[a-z0-9_]{3,20}$"
            title="3–20 chars, lowercase letters, numbers, underscore"
            required
          />
          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Allowed: lowercase letters, numbers, underscore (3–20).
          </div>
        </label>

        <label className="block">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Email
          </span>
          <input
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <label className="block">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Password
          </span>
          <input
            className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none ring-yellow-400/30 placeholder:text-neutral-400 focus:ring-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-yellow-500">
          Login
        </Link>
      </div>
    </div>
  );
}
