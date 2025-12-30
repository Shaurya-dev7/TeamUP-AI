"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, MessageCircle, Bell, User, LogOut, Sun, Moon, Sparkles, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import CinematicSwitch from "@/components/ui/cinematic-glow-toggle";
import { motion, AnimatePresence } from "framer-motion";

function NavLink({ href, label, icon: Icon, badge }: { href: string; label: string; icon: any; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 z-10 ${
        active
          ? "text-neutral-900 dark:text-white"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
      }`}
    >
      {active && (
        <motion.div
           layoutId="nav-pill"
           className="absolute inset-0 bg-white shadow-sm dark:bg-neutral-800 rounded-full -z-10"
           transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className={`w-4 h-4 ${active ? "text-yellow-400 fill-current" : ""}`} />
      <span>{label}</span>
      {badge && (
        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function AppHeader() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    async function loadUsername() {
      if (!session?.user) {
        setProfileUsername(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) setProfileUsername(null);
        else setProfileUsername((data as any)?.username ?? null);
      }
    }
    void loadUsername();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabase]);

  async function onLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const profileHref = profileUsername ? `/profile/${profileUsername}` : session?.user ? "/" : "/login";

  return (
    <>
    <header
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled 
        ? "bg-white/80 backdrop-blur-xl border-neutral-200/50 dark:bg-black/80 dark:border-white/5 py-3 shadow-sm" 
        : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative grid size-10 place-items-center rounded-xl bg-neutral-900 text-sm font-black text-yellow-400 shadow-xl shadow-neutral-900/10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 dark:bg-white dark:text-neutral-950 dark:shadow-white/5">
              TU
              <div className="absolute inset-0 rounded-xl bg-yellow-400 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
            <div className={`leading-tight transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-80'}`}>
              <div className="text-sm font-bold tracking-tight text-neutral-900 group-hover:text-yellow-500 transition-colors dark:text-white">
                TeamUp
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Find Teammates
              </div>
            </div>
          </Link>
        </div>

        {/* CENTER NAV PILL */}
        <nav className={`hidden md:flex items-center gap-1 rounded-full p-1.5 transition-all duration-500 ${
            scrolled 
            ? "bg-neutral-100/50 border border-neutral-200/50 backdrop-blur-md dark:bg-white/5 dark:border-white/5" 
            : "bg-white/70 border border-white/20 shadow-lg backdrop-blur-xl dark:bg-black/40 dark:border-white/10"
        }`}>
          <NavLink href="/" label="Home" icon={Home} />
          <NavLink href="/discover" label="Discover" icon={Compass} />
          <NavLink href="/chat" label="Chat" icon={MessageCircle} />
          <NavLink href="/notifications" label="Notifications" icon={Bell} />
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {session?.user && !profileUsername && (
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-yellow-400 shadow-md transition-all hover:scale-105 hover:bg-black hover:shadow-lg dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              onClick={() => router.push("/create-profile")}
            >
              <Sparkles className="h-4 w-4 fill-current" />
              Create Profile
            </button>
          )}

          {session?.user ? (
            <div className={`flex items-center gap-2 p-1 pr-2 rounded-full border transition-all group ${
                scrolled
                ? "border-transparent hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-800 dark:hover:bg-neutral-900/50"
                : "bg-white/50 border-white/20 backdrop-blur-md hover:bg-white dark:bg-black/20 dark:border-white/10 dark:hover:bg-black/50"
            }`}>
              <Link
                href={profileHref}
                className="flex items-center gap-2"
                title="Profile"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-2 ring-white dark:ring-neutral-900">
                  {profileUsername ? profileUsername[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="text-sm font-semibold hidden lg:block group-hover:text-yellow-600 transition-colors dark:text-neutral-200 dark:group-hover:text-yellow-400">
                  {profileUsername || "Profile"}
                </span>
              </Link>
              <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1"></div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-neutral-100 transition-colors dark:hover:bg-neutral-800"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-bold text-yellow-400 shadow-lg shadow-neutral-500/20 hover:scale-105 hover:shadow-neutral-500/30 transition-all dark:bg-white dark:text-neutral-950"
              >
                Sign up
              </Link>
            </div>
          )}
          <div className="pl-2 border-l border-neutral-200 dark:border-neutral-800">
            <CinematicSwitch />
          </div>
        </div>
      </div>
    </header>

      {/* MOBILE NAV (Bottom Bar) - kept for accessibility/ux on mobile */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/5 rounded-full px-6 py-3 flex items-center justify-between gap-6 shadow-2xl z-50">
        <Link href="/" className="flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-400 dark:aria-[current=page]:text-black transition-colors">
          <Home className="w-5 h-5" />
        </Link>
        <Link href="/discover" className="flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-400 dark:aria-[current=page]:text-black transition-colors">
          <Compass className="w-5 h-5" />
        </Link>
        
        <div className="relative -mt-8">
            <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-50"></div>
             <Link href="/chat" className="relative w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-neutral-950 shadow-lg border-4 border-neutral-900 dark:border-white transition-transform hover:scale-110 active:scale-95">
                <MessageCircle className="w-5 h-5 fill-current" />
            </Link>
        </div>

        <Link href="/notifications" className="flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-400 dark:aria-[current=page]:text-black transition-colors">
          <Bell className="w-5 h-5" />
        </Link>
        <Link href={profileHref} className="flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-400 dark:aria-[current=page]:text-black transition-colors">
          <User className="w-5 h-5" />
        </Link>
      </div>
    </>
  );
}
