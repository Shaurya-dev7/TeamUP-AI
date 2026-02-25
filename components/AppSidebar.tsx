"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Compass, Users, MessageCircle, Bell, HelpCircle, Mail, LogOut, ChevronRight, User, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import CinematicSwitch from "@/components/ui/cinematic-glow-toggle";
import { BrandLogo } from "@/components/BrandLogo";
import type { Session } from "@supabase/supabase-js";
import { ReportModal } from "@/components/ui/report-modal";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  profileUsername: string | null;
  onLogout: () => void;
}

const menuItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function AppSidebar({ isOpen, onClose, session, profileUsername, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on route change (only when pathname actually changes, not on mount)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[100dvh] w-[300px] sm:w-[350px] bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 shrink-0">
              <div className="flex items-center gap-3">
                  <div className="relative size-8 rounded-full overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800">
                    <BrandLogo className="w-full h-full" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Menu</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* User Profile Section */}
              {session?.user ? (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold shadow-md">
                        {profileUsername ? profileUsername[0].toUpperCase() : <User className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-bold truncate text-neutral-900 dark:text-neutral-100">
                            {profileUsername || "User"}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{session.user.email}</p>
                    </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-3 shrink-0">
                    <p className="text-sm text-neutral-500 font-medium">Join TeamUp today.</p>
                    <div className="flex gap-2">
                        <Link href="/login" className="flex-1 py-2 text-center text-sm font-semibold rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                            Login
                        </Link>
                        <Link href="/signup" className="flex-1 py-2 text-center text-sm font-bold text-white bg-neutral-900 dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity">
                            Sign Up
                        </Link>
                    </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 font-semibold"
                          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-yellow-500" : ""}`} />
                      {item.label}
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto text-yellow-500" />}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-4 flex flex-col gap-2">
                {session?.user && (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 font-semibold"
                    >
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Report a Bug
                    </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-900 space-y-6 bg-white dark:bg-neutral-950 shrink-0">
                <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Appearance</span>
                    <CinematicSwitch />
                </div>
                
                {session?.user && (
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-semibold text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                )}
            </div>

            <ReportModal
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              type="bug"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
