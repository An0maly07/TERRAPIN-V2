"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, LogIn, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { NotificationBell, NotificationPanel } from "@/components/home/notification-panel";
import Link from "next/link";

export function UserControls() {
  const { user, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-6 right-8 z-[100] flex items-center gap-3"
    >
      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/60 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white/90 hover:shadow-lg"
        aria-label="Search"
      >
        <Search size={20} />
      </button>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${notifOpen
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-white/[0.08] bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/90"
            }`}
          aria-label="Notifications"
        >
          <NotificationBell />
        </button>
      </div>

      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      {/* User Profile / Auth Button */}
      {loading ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        </div>
      ) : user ? (
        /* Logged In: User Dropdown */
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] pl-1.5 pr-3 text-white/80 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white hover:shadow-lg"
            aria-label="User menu"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${user.is_anonymous ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-primary to-accent"}`}>
              {user.is_anonymous
                ? "G"
                : (user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </div>
            <span className="max-w-[100px] truncate text-sm font-medium">
              {user.is_anonymous
                ? "Guest"
                : user.user_metadata?.full_name || user.email?.split("@")[0]}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.16_0.025_260/95%)] shadow-2xl shadow-black/40 backdrop-blur-2xl"
              >
                {/* User info */}
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    {user.is_anonymous ? "Guest Explorer" : user.user_metadata?.full_name || "Explorer"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {user.is_anonymous ? "Playing as guest" : user.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {user.is_anonymous ? (
                    <Link
                      href="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-primary transition-colors hover:bg-primary/10"
                    >
                      <LogIn size={16} />
                      Sign In / Sign Up
                    </Link>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
                    >
                      <Settings size={16} />
                      Account Settings
                    </Link>
                  )}

                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut size={16} />
                      {user.is_anonymous ? "Exit Guest Mode" : "Sign Out"}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Not Logged In: Sign In Button */
        <Link
          href="/login"
          className="flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/20 hover:text-white hover:shadow-lg hover:shadow-primary/20"
        >
          <LogIn size={18} />
          Sign In
        </Link>
      )}
    </motion.div>
  );
}
