"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DistanceMeter } from "./distance-meter";
import { useGameStore } from "@/stores/game-store";

export function GuessSheet() {
  const phase = useGameStore((s) => s.phase);
  const guessPosition = useGameStore((s) => s.guessPosition);
  const submitGuess = useGameStore((s) => s.submitGuess);
  const nextRound = useGameStore((s) => s.nextRound);
  const rounds = useGameStore((s) => s.rounds);
  const lastRound = rounds[rounds.length - 1];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      className="glass absolute right-4 bottom-4 left-4 z-10 rounded-xl p-4 sm:left-auto sm:w-80"
    >
      <AnimatePresence mode="wait">
        {phase === "guessing" && (
          <motion.div
            key="guessing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              {guessPosition
                ? "Pin placed! Submit your guess."
                : "Click on the map to place your pin"}
            </p>
            <Button
              onClick={submitGuess}
              disabled={!guessPosition}
              className="w-full gap-2 font-semibold"
              style={guessPosition ? { background: "var(--gradient-primary)" } : undefined}
            >
              <Send size={16} />
              Submit Guess
            </Button>
          </motion.div>
        )}

        {phase === "result" && lastRound && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <DistanceMeter distanceKm={lastRound.distanceKm} score={lastRound.score} />
            <Button onClick={nextRound} className="w-full gap-2 font-semibold">
              <SkipForward size={16} />
              Next Round
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
