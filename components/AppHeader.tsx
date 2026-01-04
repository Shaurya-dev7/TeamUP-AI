"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Users, MessageCircle, Bell, User, LogOut, Sun, Moon, Sparkles, Menu, X, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import CinematicSwitch from "@/components/ui/cinematic-glow-toggle";
import AppSidebar from "@/components/AppSidebar";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

function NavLink({ href, label, icon: Icon, badge }: { href: string; label: string; icon: any; badge?: number }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 z-10 group ${
        active
          ? "text-neutral-900 dark:text-white"
          : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
      }`}
    >
      {active && (
        <motion.div
           layoutId="nav-pill"
           className="absolute inset-0 bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] dark:bg-neutral-800 rounded-full -z-10 border border-neutral-200/50 dark:border-neutral-700/50"
           transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className={`w-4 h-4 transition-colors duration-300 ${active ? "text-yellow-500 fill-yellow-500/20" : "group-hover:text-yellow-500"}`} />
      <span className="relative">
        {label}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-3 flex h-4 w-auto min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-neutral-950 transform rotate-12 origin-bottom-left animate-in fade-in zoom-in duration-300">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
    </Link>
  );
}

import { useActivityTracker } from "@/hooks/useActivityTracker";

export default function AppHeader() {
  useActivityTracker();
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const isScrolled = latest > 10;
    if (isScrolled !== scrolled) setScrolled(isScrolled);
  });

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
        setUnreadCount(0);
        return;
      }
      
      // Fetch Profile
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) setProfileUsername(null);
        else setProfileUsername((data as any)?.username ?? null);
      }
      
      
      // Fetch Unread Notification Count
      const { count, error: countError } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", session.user.id)
        .eq("is_read", false);
        
      if (!cancelled && !countError) {
        setUnreadCount(count || 0);
      }

      // Fetch Unread Chats Count (Unique Conversations)
      const { data: unreadChats, error: chatError } = await supabase
        .from("message_status")
        .select("id, messages!inner(conversation_id)")
        .eq("user_id", session.user.id)
        .neq("status", "read");

      if (!cancelled && !chatError && unreadChats) {
          const uniqueConvIds = new Set(unreadChats.map((uc: any) => uc.messages?.conversation_id));
          setChatUnreadCount(uniqueConvIds.size);
      }
    }
    
    void loadUsername();

    // Real-time subscription for notifications and chats
    if (session?.user?.id) {
        const channel = supabase
          .channel(`header-updates-${session.user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${session.user.id}`,
            },
            () => {
              supabase
                .from("notifications")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", session.user.id)
                .eq("is_read", false)
                .then(({ count }) => {
                    setUnreadCount(count || 0);
                });
            }
          )
          .on(
            "postgres_changes",
            {
                event: "*", 
                schema: "public", 
                table: "message_status", 
                filter: `user_id=eq.${session.user.id}`
            }, 
            () => {
               // Re-fetch chat count
               supabase
                .from("message_status")
                .select("id, messages!inner(conversation_id)")
                .eq("user_id", session.user.id)
                .neq("status", "read")
                .then(({ data }) => {
                    if (data) {
                        const uniqueIds = new Set(data.map((d: any) => d.messages?.conversation_id));
                        setChatUnreadCount(uniqueIds.size);
                    }
                });
            }
          )
          .subscribe();

        return () => {
          cancelled = true;
          supabase.removeChannel(channel);
        };
    }
    
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
    <motion.header
      suppressHydrationWarning
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
        ? "py-3" 
        : "py-5"
      }`}
    >
      <div className={`absolute inset-0 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/5 supports-[backdrop-filter]:bg-white/60" />
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-6 relative z-10">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-3 select-none">
            <div className="relative grid size-10 place-items-center rounded-xl bg-neutral-950 text-sm font-black text-yellow-500 shadow-xl shadow-neutral-900/10 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 group-hover:bg-yellow-500 group-hover:text-black dark:bg-white dark:text-neutral-950 dark:shadow-white/5 dark:group-hover:bg-yellow-400">
               <span className="relative z-10">TUP</span>
            </div>
            <div className={`leading-tight flex flex-col`}>
              <div className="text-sm font-bold tracking-tight text-neutral-900 group-hover:text-yellow-600 transition-colors dark:text-white dark:group-hover:text-yellow-400">
                TeamUp
              </div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400 group-hover:tracking-widest transition-all">
                Find Teammates
              </div>
            </div>
          </Link>
        </div>

        {/* CENTER NAV PILL */}
        <nav className={`hidden md:flex items-center gap-1.5 rounded-full p-1.5 transition-all duration-300 ${
            scrolled 
            ? "bg-transparent" 
            : "bg-white/80 border border-white/40 shadow-sm backdrop-blur-md dark:bg-black/40 dark:border-white/10 ring-1 ring-black/5"
        }`}>
          <NavLink href="/" label="Home" icon={Home} />
          <NavLink href="/discover" label="Discover" icon={Compass} />
          <NavLink href="/teams" label="Teams" icon={Users} />
          <NavLink href="/chat" label="Chat" icon={MessageCircle} badge={chatUnreadCount > 0 ? chatUnreadCount : undefined} />
          <NavLink href="/notifications" label="Notifications" icon={Bell} badge={unreadCount > 0 ? unreadCount : undefined} />
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 -mr-2">
          {session?.user && !profileUsername && (
            <Link
              href="/create-profile"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition-all hover:bg-neutral-50 hover:text-black dark:border-neutral-800 dark:bg-black dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-white"
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Create Profile
            </Link>
          )}

          {session?.user ? (
            <div className={`flex items-center gap-2 p-1 pr-2 rounded-full transition-all group duration-300 ${
                scrolled
                ? "bg-transparent dark:bg-transparent"
                : "bg-white/50 border border-white/40 backdrop-blur-md hover:bg-white dark:bg-black/20 dark:border-white/10 dark:hover:bg-black/50"
            }`}>
              <Link
                href={profileHref}
                className="flex items-center gap-2 pl-1"
                title="Profile"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-xs font-bold text-white shadow-inner ring-2 ring-white dark:ring-neutral-900 group-hover:ring-yellow-400 transition-all">
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
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-neutral-500/20 transition-all hover:scale-105 hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                 <span className="relative z-10">Sign up</span>
                 <ChevronRight className="w-3 h-3 relative z-10 transition-transform group-hover:translate-x-1" />
                 <div className="absolute inset-0 -z-0 bg-gradient-to-r from-yellow-500 to-yellow-600 opacity-0 transition-opacity group-hover:opacity-100 dark:opacity-0" />
              </Link>
            </div>
          )}
          {/* MENU TOGGLE - Visible on all screens for FAQ/Contact access */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-900 dark:text-white" />
          </button>
        </div>
      </div>
    </motion.header>
    
    <AppSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        session={session} 
        profileUsername={profileUsername}
        onLogout={onLogout}
    />

      {/* MOBILE NAV (Bottom Bar) - refined */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border border-neutral-200/50 dark:border-white/10 rounded-full px-6 py-3 flex items-center justify-between gap-8 shadow-2xl shadow-black/20 z-[100]">
        <Link href="/" className="group flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-500 dark:aria-[current=page]:text-white transition-colors">
          <Home className="w-5 h-5 group-active:scale-95 transition-transform" />
        </Link>
        <Link href="/discover" className="group flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-500 dark:aria-[current=page]:text-white transition-colors">
          <Compass className="w-5 h-5 group-active:scale-95 transition-transform" />
        </Link>
        <Link href="/teams" className="group flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-500 dark:aria-[current=page]:text-white transition-colors">
          <Users className="w-5 h-5 group-active:scale-95 transition-transform" />
        </Link>
        
        <div className="relative -mt-8">
            <div className={`absolute inset-0 bg-yellow-400 blur-xl opacity-40 animate-pulse ${chatUnreadCount > 0 ? 'bg-red-500 opacity-60' : ''}`}></div>
             <Link href="/chat" className="relative w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-black shadow-lg shadow-yellow-500/30 border-4 border-white dark:border-neutral-950 transition-transform hover:scale-110 active:scale-95">
                <MessageCircle className="w-6 h-6 fill-current" />
                {chatUnreadCount > 0 && (
                   <span className="absolute -top-0 -right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-neutral-900 shadow-md">
                     {chatUnreadCount}
                   </span>
                )}
            </Link>
        </div>

        <Link href="/notifications" className="group flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-500 dark:aria-[current=page]:text-white transition-colors relative">
          <Bell className="w-5 h-5 group-active:scale-95 transition-transform" />
          {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white dark:border-neutral-950 shadow-md rotate-12">
               {unreadCount > 99 ? '!' : unreadCount}
             </span>
          )}
        </Link>
        <Link href={profileHref} className="group flex flex-col items-center gap-1 text-neutral-400 dark:text-neutral-500 aria-[current=page]:text-yellow-500 dark:aria-[current=page]:text-white transition-colors">
          <User className="w-5 h-5 group-active:scale-95 transition-transform" />
        </Link>
      </div>
    </>
  );
}
