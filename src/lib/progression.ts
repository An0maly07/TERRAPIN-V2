/**
 * TerraPin Progression System — Pure Functions
 *
 * All functions are deterministic and side-effect-free.
 * They compute XP, levels, and credits from raw game data.
 */

import type { ProgressionReward, LevelThreshold } from "@/types/profile";

// ── Tuning Constants ────────────────────────────────────────────────────────

/** Fraction of game score converted to base XP (25,000 max score → 1,000 base XP) */
const XP_ACCURACY_MULTIPLIER = 0.04;

/** Max speed bonus XP per round (awarded when answer is instant) */
const XP_SPEED_MAX_PER_ROUND = 30;

/** Streak bonus = bestStreak² * this value */
const XP_STREAK_MULTIPLIER = 10;

/** Minimum round score to count as a "good" round for streak purposes */
const STREAK_SCORE_THRESHOLD = 2500;

/** Fraction of earned XP converted to TerraCredits */
const CREDIT_XP_RATIO = 0.1;

/** Level-up credit bonus = this * newLevel */
const CREDIT_LEVELUP_MULTIPLIER = 50;

/** Base constant for the XP-to-level curve */
const LEVEL_XP_BASE = 50;

/** Exponent for the XP-to-level power curve (higher = steeper late-game) */
const LEVEL_XP_EXPONENT = 1.75;

/** Hard cap on player level */
const MAX_LEVEL = 100;

// ── Level Math ──────────────────────────────────────────────────────────────

/**
 * Cumulative XP required to reach a given level.
 *
 * Formula: floor(50 * (level - 1) ^ 1.75)
 *
 * Examples:
 *   Level  1 →      0 XP  (starting level)
 *   Level  2 →     50 XP
 *   Level  5 →    566 XP
 *   Level 10 →  2,153 XP
 *   Level 25 → 12,700 XP
 *   Level 50 → 45,400 XP
 *   Level 100 → 162,250 XP
 */
export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(LEVEL_XP_BASE * Math.pow(level - 1, LEVEL_XP_EXPONENT));
}

/**
 * Determine the player's level from their cumulative XP.
 * Performs a simple linear scan (max 100 iterations — negligible cost).
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  while (level < MAX_LEVEL && totalXP >= xpRequiredForLevel(level + 1)) {
    level++;
  }
  return level;
}

/**
 * XP needed to go from the current level to the next one.
 * Returns 0 if already at MAX_LEVEL.
 */
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return xpRequiredForLevel(currentLevel + 1) - xpRequiredForLevel(currentLevel);
}

/**
 * Fraction of progress (0–1) toward the next level.
 * Useful for rendering the XP progress bar.
 */
export function levelProgress(totalXP: number): number {
  const level = calculateLevel(totalXP);
  if (level >= MAX_LEVEL) return 1;
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range <= 0) return 1;
  return (totalXP - currentLevelXP) / range;
}

/**
 * Build a full level table (useful for debug or UI tooltips).
 */
export function buildLevelTable(): LevelThreshold[] {
  const table: LevelThreshold[] = [];
  for (let l = 1; l <= MAX_LEVEL; l++) {
    table.push({ level: l, xpRequired: xpRequiredForLevel(l) });
  }
  return table;
}

// ── XP Calculation ──────────────────────────────────────────────────────────

interface RoundInput {
  readonly score: number;
  readonly timeSpent: number;
}

/**
 * Compute the best streak from a sequence of round results.
 * A streak increments when a round's score exceeds the threshold.
 */
export function computeBestStreak(rounds: ReadonlyArray<RoundInput>): number {
  let best = 0;
  let current = 0;
  for (const round of rounds) {
    if (round.score > STREAK_SCORE_THRESHOLD) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

/**
 * Calculate XP earned from a single completed game.
 *
 * @param gameScore   Total game score (sum of round scores, 0–25,000 typical)
 * @param rounds      Per-round data (score and timeSpent in seconds)
 * @param timePerRound  Time allowed per round in seconds (120 classic, 60 campaign)
 * @returns Breakdown of base, speed, streak, and total XP, plus the best streak
 */
export function calculateXP(
  gameScore: number,
  rounds: ReadonlyArray<RoundInput>,
  timePerRound: number
): {
  baseXP: number;
  speedBonus: number;
  streakBonus: number;
  totalXP: number;
  bestStreak: number;
} {
  // Base XP: linear fraction of game score
  const baseXP = Math.floor(gameScore * XP_ACCURACY_MULTIPLIER);

  // Speed bonus: reward time remaining on each round
  let speedBonus = 0;
  for (const round of rounds) {
    const timeRemaining = Math.max(0, timePerRound - round.timeSpent);
    const fraction = timePerRound > 0 ? timeRemaining / timePerRound : 0;
    speedBonus += Math.floor(fraction * XP_SPEED_MAX_PER_ROUND);
  }

  // Streak bonus: quadratic reward for consecutive good rounds
  const bestStreak = computeBestStreak(rounds);
  const streakBonus = bestStreak * bestStreak * XP_STREAK_MULTIPLIER;

  return {
    baseXP,
    speedBonus,
    streakBonus,
    totalXP: baseXP + speedBonus + streakBonus,
    bestStreak,
  };
}

// ── Credits Calculation ─────────────────────────────────────────────────────

/**
 * Calculate TerraCredits earned from a game.
 *
 * @param xpEarned      Total XP earned this game
 * @param previousLevel Level before this game
 * @param newLevel      Level after adding XP
 * @returns Credits from XP conversion + any level-up bonus
 */
export function calculateCreditReward(
  xpEarned: number,
  previousLevel: number,
  newLevel: number
): { credits: number; levelUpBonus: number } {
  // Base credits: 10% of XP earned
  const baseCredits = Math.floor(xpEarned * CREDIT_XP_RATIO);

  // Level-up bonus: flat reward for each level gained
  let levelUpBonus = 0;
  for (let l = previousLevel + 1; l <= newLevel; l++) {
    levelUpBonus += CREDIT_LEVELUP_MULTIPLIER * l;
  }

  return {
    credits: baseCredits + levelUpBonus,
    levelUpBonus,
  };
}

// ── Unified Reward Calculator ───────────────────────────────────────────────

/**
 * Master function: computes the full progression reward for a completed game.
 * This is the single entry point called from the game store / UI.
 *
 * @param gameScore     Total game score
 * @param rounds        Per-round results array
 * @param timePerRound  Time allowed per round in seconds
 * @param currentTotalXP Player's total XP before this game
 * @param currentLevel   Player's level before this game
 */
export function calculateProgressionReward(
  gameScore: number,
  rounds: ReadonlyArray<RoundInput>,
  timePerRound: number,
  currentTotalXP: number,
  currentLevel: number
): ProgressionReward {
  const xp = calculateXP(gameScore, rounds, timePerRound);

  const newTotalXP = currentTotalXP + xp.totalXP;
  const newLevel = calculateLevel(newTotalXP);
  const didLevelUp = newLevel > currentLevel;

  const creditResult = calculateCreditReward(xp.totalXP, currentLevel, newLevel);

  return {
    baseXP: xp.baseXP,
    speedBonus: xp.speedBonus,
    streakBonus: xp.streakBonus,
    totalXP: xp.totalXP,
    bestStreak: xp.bestStreak,
    creditsEarned: creditResult.credits,
    newTotalXP,
    previousLevel: currentLevel,
    newLevel,
    didLevelUp,
    levelUpCreditBonus: creditResult.levelUpBonus,
  };
}
