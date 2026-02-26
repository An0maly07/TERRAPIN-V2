"use client";

import { motion } from "framer-motion";
import { Search, User, Bell } from "lucide-react";

export function UserControls() {
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

      <button
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/60 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white/90 hover:shadow-lg"
        aria-label="User profile"
      >
        <User size={20} />
      </button>

      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-white/60 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white/90 hover:shadow-lg"
        aria-label="Notifications"
      >
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.625rem] font-bold text-white shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
          3
        </span>
      </button>
    </motion.div>
  );
}
