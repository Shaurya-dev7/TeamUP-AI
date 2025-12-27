"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bell, Settings, HelpCircle, Shield } from "lucide-react";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getInitialSession, subscribeToAuthChanges, fetchProfileUsername, signOut } from "@/services/auth";
import ThemeToggle from "./ThemeToggle";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() ?? '/';
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-yellow-400 text-neutral-950"
          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-900",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const s = await getInitialSession(supabase);
      if (mounted) setSession(s);
      unsubscribe = subscribeToAuthChanges(supabase, (next) => setSession(next));
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsername() {
      if (!session?.user) {
        setProfileUsername(null);
        return;
      }

      const username = await fetchProfileUsername(supabase, session.user.id);
      if (!cancelled) setProfileUsername(username);
    }

    void loadUsername();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase]);

  async function onLogout() {
    await signOut(supabase);
    router.push("/login");
    router.refresh();
  }

  const profileHref = profileUsername
    ? `/profile/${profileUsername}`
    : session?.user
      ? "/"
      : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-neutral-950 text-sm font-black text-yellow-400 dark:bg-white dark:text-neutral-950">
              TU
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">TeamUp</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Find teammates, faster
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink href="/" label="Home" />
            <NavLink href="/discover" label="Discover" />
            <NavLink href="/chat" label="Chat" />
            <NavLink href="/notifications" label="Notifications" />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={profileHref}
            className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-yellow-400 shadow-sm hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
            title="Profile"
          >
            Profile
          </Link>

          {/* Create your profile button for logged-in users without a profile */}
          {session?.user && !profileUsername && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-400"
              onClick={() => router.push("/create-profile")}
            >
              Create your profile
            </button>
          )}

          {session?.user ? (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-3 py-2 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-yellow-300"
            >
              Logout
            </button>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-yellow-300"
              >
                Sign up
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-3 sm:px-6 md:hidden">
        <nav className="flex items-center gap-1 overflow-x-auto">
          <NavLink href="/" label="Home" />
          <NavLink href="/discover" label="Discover" />
          <NavLink href="/chat" label="Chat" />
          <NavLink href="/notifications" label="Notifications" />
        </nav>
      </div>
    </header>
  );
}
