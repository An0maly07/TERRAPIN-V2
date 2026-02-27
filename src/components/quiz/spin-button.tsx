"use client";

import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoulettePhase } from "@/types/quiz";

interface SpinButtonProps {
  phase: RoulettePhase;
  onSpin: () => void;
}

export function SpinButton({ phase, onSpin }: SpinButtonProps) {
  const isDisabled = phase === "spinning";

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : undefined}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      onClick={onSpin}
      disabled={isDisabled}
      className={cn(
        "shimmer relative flex items-center gap-3 rounded-xl px-10 py-4 text-lg font-extrabold uppercase tracking-wider transition-all duration-300",
        isDisabled
          ? "cursor-not-allowed opacity-50 bg-gradient-to-r from-amber-500 to-amber-400 text-black"
          : "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-[0_0_30px_oklch(0.8_0.15_85_/_0.3)] hover:shadow-[0_0_40px_oklch(0.8_0.15_85_/_0.5)]"
      )}
    >
      <motion.div
        animate={
          phase === "spinning" ? { rotate: 360 } : { rotate: 0 }
        }
        transition={
          phase === "spinning"
            ? { duration: 1, repeat: Infinity, ease: "linear" }
            : { duration: 0.3 }
        }
      >
        <Dices size={22} />
      </motion.div>
      {phase === "spinning"
        ? "SPINNING..."
        : phase === "landed"
          ? "SPIN AGAIN"
          : "SPIN"}
    </motion.button>
  );
}
