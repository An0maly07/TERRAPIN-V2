"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer } from "./timer";
import { useGameStore } from "@/stores/game-store";

export function GameHUD() {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const score = useGameStore((s) => s.score);
  const streak = useGameStore((s) => s.streak);
  const phase = useGameStore((s) => s.phase);
  const resetGame = useGameStore((s) => s.resetGame);

  const displayRounds = totalRounds >= 999 ? "∞" : totalRounds;

  // Hide HUD during result phase — the full-screen map + ResultPanel take over
  if (phase === "result") return null;

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="glass flex items-center justify-between px-4 py-2 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1.5 font-semibold">
          <MapPin size={12} />
          Round {currentRound}/{displayRounds}
        </Badge>
        {streak > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs font-bold text-accent"
            >
              🔥 {streak} streak
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Timer />

      <div className="flex items-center gap-3">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={score}
            initial={{ scale: 1.3, color: "var(--primary)" }}
            animate={{ scale: 1, color: "var(--foreground)" }}
            className="min-w-[80px] text-right font-mono text-sm font-bold"
          >
            {score.toLocaleString()} pts
          </motion.div>
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => {
            resetGame();
            router.push("/");
          }}
        >
          <LogOut size={16} />
        </Button>
      </div>
    </motion.div>
  );
}
