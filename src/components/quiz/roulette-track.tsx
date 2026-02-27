"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { QuizCategory, RoulettePhase } from "@/types/quiz";
import { RouletteCard } from "./roulette-card";

interface RouletteTrackProps {
  track: QuizCategory[];
  translateX: number;
  phase: RoulettePhase;
  winnerIndex: number;
  cardWidth: number;
  cardGap: number;
  totalCardSlot: number;
  spinDuration: number;
  easing: readonly [number, number, number, number];
  onCardCrossing: () => void;
}

export function RouletteTrack({
  track,
  translateX,
  phase,
  winnerIndex,
  cardWidth,
  cardGap,
  totalCardSlot,
  spinDuration,
  easing,
  onCardCrossing,
}: RouletteTrackProps) {
  const prevCardIndexRef = useRef<number>(-1);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Poll computed transform during spinning to detect card boundary crossings
  useEffect(() => {
    if (phase !== "spinning" || !trackRef.current) return;

    prevCardIndexRef.current = -1;

    const checkCrossing = () => {
      const el = trackRef.current;
      if (!el) return;

      const style = window.getComputedStyle(el);
      const matrix = new DOMMatrix(style.transform);
      const currentX = matrix.m41;

      const viewportCenter = el.parentElement?.offsetWidth
        ? el.parentElement.offsetWidth / 2
        : 400;
      const posInTrack = viewportCenter - currentX;
      const currentCardIndex = Math.floor(posInTrack / totalCardSlot);

      if (
        currentCardIndex !== prevCardIndexRef.current &&
        prevCardIndexRef.current !== -1
      ) {
        onCardCrossing();
      }
      prevCardIndexRef.current = currentCardIndex;

      rafRef.current = requestAnimationFrame(checkCrossing);
    };

    rafRef.current = requestAnimationFrame(checkCrossing);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, totalCardSlot, onCardCrossing]);

  const isLanded = phase === "landed";

  return (
    <motion.div
      ref={trackRef}
      className="flex"
      style={{ gap: cardGap }}
      initial={{ x: 0 }}
      animate={{ x: phase === "idle" ? 0 : translateX }}
      transition={
        phase === "spinning"
          ? {
              duration: spinDuration,
              ease: easing as unknown as [number, number, number, number],
            }
          : phase === "idle"
            ? { duration: 0 }
            : { duration: 0.3 }
      }
    >
      {track.map((category, i) => (
        <RouletteCard
          key={`${category.id}-${i}`}
          category={category}
          isWinner={i === winnerIndex}
          isLanded={isLanded}
          width={cardWidth}
        />
      ))}
    </motion.div>
  );
}
