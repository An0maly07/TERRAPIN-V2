"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShareButtons } from "./share-buttons";
import { ProgressionSummary } from "./progression-summary";
import { LevelUpOverlay } from "./level-up-overlay";
import { useGameStore } from "@/stores/game-store";
import { usePlayerStore } from "@/stores/player-store";
import { useAuth } from "@/components/auth/auth-provider";
import { MAX_SCORE_PER_ROUND } from "@/lib/constants";

export function ResultsModal() {
  const router = useRouter();
  const { user } = useAuth();

  // Game state
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const rounds = useGameStore((s) => s.rounds);
  const streak = useGameStore((s) => s.streak);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const timePerRound = useGameStore((s) => s.timePerRound);
  const resetGame = useGameStore((s) => s.resetGame);

  // Player progression
  const completeGame = usePlayerStore((s) => s.completeGame);
  const clearLastReward = usePlayerStore((s) => s.clearLastReward);
  const lastReward = usePlayerStore((s) => s.lastReward);

  const maxPossible = Math.min(totalRounds, rounds.length) * MAX_SCORE_PER_ROUND;
  const percentage = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;
  const isOpen = phase === "summary";

  // Calculate progression exactly once per game summary
  const hasCalculatedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !hasCalculatedRef.current && rounds.length > 0) {
      hasCalculatedRef.current = true;
      const userId = user && !user.is_anonymous ? user.id : undefined;
      completeGame(score, rounds, timePerRound, userId);
    }
    if (!isOpen) {
      hasCalculatedRef.current = false;
    }
  }, [isOpen, rounds, score, timePerRound, completeGame, user]);

  const handlePlayAgain = () => {
    clearLastReward();
    resetGame();
    router.push("/");
  };

  return (
    <>
      {/* Level-up celebration overlay (renders above everything) */}
      <LevelUpOverlay reward={lastReward} />

      <Dialog open={isOpen}>
        <DialogContent className="glass max-h-[90vh] overflow-y-auto border-border bg-background/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="flex flex-col items-center gap-3 text-2xl">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Trophy size={48} className="text-primary" />
              </motion.div>
              Game Complete!
            </DialogTitle>
            <DialogDescription>Here&apos;s how you did</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Score */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold gradient-text"
              >
                {score.toLocaleString()}
              </motion.div>
              <p className="mt-1 text-sm text-muted-foreground">
                out of {maxPossible.toLocaleString()} possible ({percentage}%)
              </p>
            </div>

            {streak > 0 && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="gap-1.5">
                  🔥 Best streak: {streak}
                </Badge>
              </div>
            )}

            <Separator />

            {/* Progression Summary */}
            {lastReward && <ProgressionSummary reward={lastReward} />}

            <Separator />

            {/* Round breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Round Breakdown</h4>
              {rounds.map((round, i) => {
                const pct = (round.score / MAX_SCORE_PER_ROUND) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-8 text-muted-foreground">R{i + 1}</span>
                    <div className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                          className={`h-full rounded-full ${pct >= 80
                              ? "bg-green-500"
                              : pct >= 50
                                ? "bg-yellow-500"
                                : pct >= 20
                                  ? "bg-orange-500"
                                  : "bg-destructive"
                            }`}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right font-mono text-xs">
                      {round.score.toLocaleString()}
                    </span>
                    <span className="w-20 text-right text-xs text-muted-foreground">
                      {Math.round(round.distanceKm).toLocaleString()} km
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <ShareButtons />
              <Button
                onClick={handlePlayAgain}
                className="w-full gap-2 font-semibold"
                style={{ background: "var(--gradient-primary)" }}
              >
                <RotateCcw size={16} />
                Play Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
