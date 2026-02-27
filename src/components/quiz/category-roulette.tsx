"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useRoulette } from "./use-roulette";
import { useTickSound } from "./use-tick-sound";
import { RouletteViewport } from "./roulette-viewport";
import { RouletteTrack } from "./roulette-track";
import { SpinButton } from "./spin-button";

interface CategoryRouletteProps {
  onBack?: () => void;
  onCategorySelected?: (categoryId: string) => void;
}

export function CategoryRoulette({
  onBack,
  onCategorySelected,
}: CategoryRouletteProps) {
  const {
    state,
    viewportRef,
    spin,
    reset,
    CARD_WIDTH,
    CARD_GAP,
    TOTAL_CARD_SLOT,
    SPIN_DURATION,
    EASING,
  } = useRoulette();

  const tick = useTickSound();

  const handleSpin = useCallback(() => {
    if (state.phase === "landed") {
      reset();
      setTimeout(() => spin(), 100);
    } else {
      spin();
    }
  }, [state.phase, spin, reset]);

  const handleContinue = useCallback(() => {
    if (state.winner && onCategorySelected) {
      onCategorySelected(state.winner.id);
    }
  }, [state.winner, onCategorySelected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex w-full max-w-[920px] flex-col items-center text-white"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold italic uppercase tracking-wide">
          Quiz Mode
        </h1>
        <div className="mx-auto mt-2 mb-2 h-[3px] w-[100px] rounded-sm bg-amber-400 shadow-[0_0_12px_oklch(0.8_0.15_85_/_0.55)]" />
        <p className="text-xs font-semibold italic uppercase tracking-widest text-white/50">
          Spin to reveal your category
        </p>
      </div>

      {/* Roulette Viewport */}
      <RouletteViewport ref={viewportRef} className="mb-8 h-[220px]">
        {state.track.length > 0 && (
          <RouletteTrack
            track={state.track}
            translateX={state.translateX}
            phase={state.phase}
            winnerIndex={state.winnerIndex}
            cardWidth={CARD_WIDTH}
            cardGap={CARD_GAP}
            totalCardSlot={TOTAL_CARD_SLOT}
            spinDuration={SPIN_DURATION}
            easing={EASING}
            onCardCrossing={tick}
          />
        )}
      </RouletteViewport>

      {/* Winner announcement */}
      <AnimatePresence>
        {state.phase === "landed" && state.winner && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-6 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Category Selected
              </span>
              <Sparkles size={16} />
            </div>
            <span className="text-2xl font-extrabold uppercase tracking-wide">
              {state.winner.label}
            </span>
            {onCategorySelected && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleContinue}
                className="mt-2 rounded-lg bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_oklch(0.65_0.2_265_/_0.4)]"
              >
                Start Quiz
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spin Button */}
      <SpinButton phase={state.phase} onSpin={handleSpin} />

      {/* Back button */}
      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onBack}
          className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white/50 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/70"
        >
          <ArrowLeft size={14} />
          Back
        </motion.button>
      )}
    </motion.div>
  );
}
