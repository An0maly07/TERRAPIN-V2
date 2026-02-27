"use client";

import { motion } from "framer-motion";
import { Globe, Users, HelpCircle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { TerrapinLogo } from "@/components/shared/terrapin-logo";
import type { LandingMode } from "@/app/page";

interface NavItemConfig {
  id: LandingMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const PRIMARY_NAV: NavItemConfig[] = [
  { id: "singleplayer", label: "SINGLEPLAYER", icon: Globe },
  { id: "multiplayer", label: "MULTIPLAYER", icon: Users },
];

const SECONDARY_NAV = [
  { label: "QUIZ", icon: HelpCircle },
];

interface VerticalNavProps {
  activeMode: LandingMode;
  onModeChange: (mode: LandingMode) => void;
}

export function VerticalNav({ activeMode, onModeChange }: VerticalNavProps) {
  return (
    <div className="flex h-full w-[320px] flex-col justify-center gap-8 pl-5">
      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="px-5"
      >
        <TerrapinLogo size="md" animated={false} />
        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Explore the World
        </p>
      </motion.div>

      {/* Primary Nav */}
      <nav className="flex flex-col gap-4 px-5">
        {PRIMARY_NAV.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeMode === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.1 + index * 0.1,
                duration: 0.6,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              onClick={() => onModeChange(item.id)}
              className={cn(
                "relative flex w-full items-center justify-start gap-3 rounded-full border-2 px-8 py-4 text-left text-[1.1rem] font-extrabold uppercase tracking-wide transition-all duration-300",
                isActive
                  ? "translate-x-1 translate-y-1 border-[oklch(0.13_0.02_260)] bg-primary text-white shadow-[4px_4px_0px_0px_oklch(0.13_0.02_260)]"
                  : "border-[oklch(0.13_0.02_260)] bg-white text-[oklch(0.13_0.02_260)] shadow-[8px_8px_0px_0px_oklch(0.65_0.2_265)] hover:translate-x-1 hover:translate-y-1 hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_oklch(0.65_0.2_265)]"
              )}
              whileTap={{ x: 6, y: 6 }}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-primary"} />
              <span className="flex-1">{item.label}</span>
            </motion.button>
          );
        })}

        {/* Secondary Nav */}
        {SECONDARY_NAV.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, x: -120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.1 + (PRIMARY_NAV.length + index) * 0.1,
                duration: 0.6,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="relative flex w-full items-center justify-start gap-3 rounded-full border-2 border-[oklch(0.13_0.02_260)] bg-white px-8 py-4 text-left text-[1.1rem] font-extrabold uppercase tracking-wide text-[oklch(0.13_0.02_260)] shadow-[8px_8px_0px_0px_oklch(0.65_0.2_265)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:bg-gray-50 hover:shadow-[4px_4px_0px_0px_oklch(0.65_0.2_265)]"
            >
              <Icon size={20} className="text-primary" />
              <span className="flex-1">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* How to Play hint */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex items-center gap-2 px-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-200 hover:text-muted-foreground"
      >
        <BookOpen size={13} />
        How to Play
      </motion.button>
    </div>
  );
}
