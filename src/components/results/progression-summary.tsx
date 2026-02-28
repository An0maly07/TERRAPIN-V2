"use client";

import { motion } from "framer-motion";
import { Zap, Timer, Flame, TrendingUp, Coins } from "lucide-react";
import type { ProgressionReward } from "@/types/profile";
import { levelProgress, xpForNextLevel, xpRequiredForLevel } from "@/lib/progression";

interface ProgressionSummaryProps {
  reward: ProgressionReward;
}

export function ProgressionSummary({ reward }: ProgressionSummaryProps) {
  const {
    baseXP,
    speedBonus,
    streakBonus,
    totalXP,
    creditsEarned,
    newTotalXP,
    previousLevel,
    newLevel,
    didLevelUp,
    levelUpCreditBonus,
  } = reward;

  const progress = levelProgress(newTotalXP);
  const xpToNext = xpForNextLevel(newLevel);
  const currentLevelXP = xpRequiredForLevel(newLevel);
  const xpIntoLevel = newTotalXP - currentLevelXP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">Progression</h4>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 15 }}
          className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400"
        >
          <Coins size={12} />
          +{creditsEarned}
        </motion.div>
      </div>

      {/* XP earned breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <XPChip icon={<Zap size={12} />} label="Accuracy" value={baseXP} delay={0.5} />
        <XPChip icon={<Timer size={12} />} label="Speed" value={speedBonus} delay={0.6} />
        <XPChip icon={<Flame size={12} />} label="Streak" value={streakBonus} delay={0.7} />
      </div>

      {/* Total XP earned */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-sm"
      >
        <TrendingUp size={14} className="text-primary" />
        <span className="font-bold text-primary">+{totalXP} XP</span>
      </motion.div>

      {/* Level + XP bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <LevelBadge level={newLevel} didLevelUp={didLevelUp} />
            {didLevelUp && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="text-xs font-semibold text-green-400"
              >
                Level Up! {previousLevel} → {newLevel}
              </motion.span>
            )}
          </div>
          <span className="tabular-nums text-muted-foreground">
            {xpToNext > 0
              ? `${xpIntoLevel} / ${xpToNext + xpIntoLevel} XP`
              : "MAX"}
          </span>
        </div>

        {/* XP progress bar */}
        <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
          {/* Previous progress (instant) */}
          {didLevelUp && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ delay: 0.9, duration: 0.3 }}
              className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
            />
          )}
          {/* New progress (animated fill) */}
          <motion.div
            initial={{ width: didLevelUp ? "0%" : `${levelProgress(newTotalXP - totalXP) * 100}%` }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ delay: didLevelUp ? 1.2 : 0.9, duration: 0.8, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
          />
          {/* Shimmer effect on the bar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ delay: didLevelUp ? 2.0 : 1.7, duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
        </div>
      </div>

      {/* Level-up credit bonus callout */}
      {didLevelUp && levelUpCreditBonus > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 1.5, duration: 0.3 }}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-400"
        >
          <Coins size={12} />
          Level-up bonus: +{levelUpCreditBonus} credits
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function XPChip({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2 py-2"
    >
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums text-foreground">+{value}</span>
    </motion.div>
  );
}

function LevelBadge({ level, didLevelUp }: { level: number; didLevelUp: boolean }) {
  return (
    <motion.div
      animate={
        didLevelUp
          ? { scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] }
          : {}
      }
      transition={didLevelUp ? { delay: 1.0, duration: 0.5 } : {}}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-[11px] font-extrabold text-white shadow-md shadow-primary/25"
    >
      {level}
    </motion.div>
  );
}
