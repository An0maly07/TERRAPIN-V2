"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { useGameStore } from "@/stores/game-store";
import { cn } from "@/lib/utils";

export function Timer() {
  const timer = useGameStore((s) => s.timer);
  const phase = useGameStore((s) => s.phase);
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    if (phase !== "guessing") return;
    const interval = setInterval(tickTimer, 1000);
    return () => clearInterval(interval);
  }, [phase, tickTimer]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const isLow = timer <= 10;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-sm font-bold transition-colors",
        isLow ? "bg-destructive/20 text-destructive" : "bg-muted text-foreground"
      )}
    >
      <Clock size={14} className={cn(isLow && "animate-pulse")} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={timer}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
