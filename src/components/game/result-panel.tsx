"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ThumbsUp, Meh, XCircle, MapPin, Star, SkipForward, Flag } from "lucide-react";
import { useGameStore } from "@/stores/game-store";

// ── Rating tiers ────────────────────────────────────────────────────────────

interface RatingConfig {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  glow: string;
}

function getRating(score: number): RatingConfig {
  if (score >= 4500)
    return {
      label: "Excellent!",
      icon: <Trophy size={18} />,
      bg: "bg-amber-500/15",
      border: "border-amber-500/40",
      text: "text-amber-400",
      glow: "shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    };
  if (score >= 2500)
    return {
      label: "Good!",
      icon: <ThumbsUp size={18} />,
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/40",
      text: "text-emerald-400",
      glow: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    };
  if (score >= 1000)
    return {
      label: "Not bad",
      icon: <Meh size={18} />,
      bg: "bg-blue-500/15",
      border: "border-blue-500/40",
      text: "text-blue-400",
      glow: "shadow-[0_0_20px_rgba(96,165,250,0.15)]",
    };
  return {
    label: "Try again!",
    icon: <XCircle size={18} />,
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    text: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(248,113,113,0.15)]",
  };
}

// ── Count-up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1500): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    let frame: number;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return current;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ResultPanel() {
  const phase = useGameStore((s) => s.phase);
  const rounds = useGameStore((s) => s.rounds);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const nextRound = useGameStore((s) => s.nextRound);

  const lastRound = rounds[rounds.length - 1];
  const isLastRound = currentRound >= totalRounds;

  const animatedScore = useCountUp(lastRound?.score ?? 0, 1500);

  if (phase !== "result" || !lastRound) return null;

  const rating = getRating(lastRound.score);
  const distanceDisplay =
    lastRound.distanceKm < 1
      ? `${Math.round(lastRound.distanceKm * 1000)} m`
      : `${Math.round(lastRound.distanceKm).toLocaleString()} km`;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.15 }}
      className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center px-4 sm:px-6"
    >
      <div className="pointer-events-auto flex w-full max-w-[900px] items-center gap-3 rounded-2xl border border-white/[0.12] bg-[linear-gradient(135deg,rgba(10,10,26,0.97),rgba(15,15,35,0.97))] px-5 py-3.5 shadow-[0_12px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-2xl sm:gap-5 sm:px-8 sm:py-4">
        {/* Rating badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 18 }}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${rating.bg} ${rating.border} ${rating.text} ${rating.glow}`}
        >
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 250, damping: 14 }}
          >
            {rating.icon}
          </motion.span>
          <span className="text-xs font-extrabold uppercase tracking-wider sm:text-sm">
            {rating.label}
          </span>
        </motion.div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />

        {/* Distance card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
            <MapPin size={14} className="text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Distance
            </span>
            <span className="text-sm font-bold tabular-nums text-white">
              {distanceDisplay}
            </span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-white/[0.08] sm:block" />

        {/* Score card (count-up) */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15">
            <Star size={14} className="text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Score
            </span>
            <span className="text-sm font-bold tabular-nums text-white">
              {animatedScore.toLocaleString()} pts
            </span>
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Next Round / Finish Game button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 250, damping: 20 }}
          onClick={nextRound}
          className="flex items-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(16,185,129,0.45)] active:scale-[0.97] sm:px-7 sm:py-3 sm:text-[13px]"
        >
          {isLastRound ? (
            <>
              <Flag size={14} />
              Finish Game
            </>
          ) : (
            <>
              <SkipForward size={14} />
              Next Round
            </>
          )}
          <kbd className="ml-1 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[9px] font-normal tracking-normal text-white/50">
            N
          </kbd>
        </motion.button>
      </div>
    </motion.div>
  );
}
