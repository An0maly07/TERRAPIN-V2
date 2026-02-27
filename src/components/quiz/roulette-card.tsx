"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuizCategory } from "@/types/quiz";

interface RouletteCardProps {
  category: QuizCategory;
  isWinner: boolean;
  isLanded: boolean;
  width: number;
}

export function RouletteCard({
  category,
  isWinner,
  isLanded,
  width,
}: RouletteCardProps) {
  const Icon = category.icon;
  const accentColor = `oklch(0.65 0.2 ${category.hue})`;
  const glowColor = `oklch(0.65 0.2 ${category.hue} / 0.4)`;

  return (
    <motion.div
      animate={
        isLanded && isWinner
          ? { scale: 1.08, y: -4 }
          : isLanded && !isWinner
            ? { opacity: 0.3, scale: 0.95 }
            : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "glass flex shrink-0 flex-col items-center justify-center gap-3 rounded-xl p-4 select-none"
      )}
      style={{
        width,
        height: width * 1.15,
        ...(isLanded && isWinner
          ? {
              borderColor: accentColor,
              boxShadow: `0 0 30px ${glowColor}, 0 8px 32px rgba(0,0,0,0.4)`,
            }
          : {}),
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `oklch(0.65 0.2 ${category.hue} / 0.15)`,
        }}
      >
        <Icon size={24} style={{ color: accentColor }} />
      </div>
      <span className="text-center text-sm font-bold uppercase tracking-wide text-white/90">
        {category.label}
      </span>
    </motion.div>
  );
}
