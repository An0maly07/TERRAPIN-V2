import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProgressionReward, PlayerProfile } from "@/types/profile";
import { calculateProgressionReward } from "@/lib/progression";
import { createClient } from "@/lib/supabase/client";

interface RoundInput {
  readonly score: number;
  readonly timeSpent: number;
}

interface PlayerState {
  // ── Profile data (persisted to localStorage for offline/guest support) ──
  level: number;
  totalXP: number;
  terraCredits: number;
  highestStreak: number;
  gamesPlayed: number;
  totalScore: number;

  // ── Transient UI state (not persisted) ──
  /** The reward from the most recent game — drives the animation in ProgressionSummary */
  lastReward: ProgressionReward | null;
  /** True while a Supabase sync is in flight */
  isSyncing: boolean;

  // ── Actions ──
  /**
   * Called once when a game reaches the "summary" phase.
   * Calculates the progression reward, updates local state, and
   * optionally syncs to Supabase if a userId is provided.
   */
  completeGame: (
    gameScore: number,
    rounds: ReadonlyArray<RoundInput>,
    timePerRound: number,
    userId?: string
  ) => ProgressionReward;

  /** Load profile from Supabase (source of truth for authenticated users) */
  loadFromSupabase: (userId: string) => Promise<void>;

  /** Clear the last reward (called when leaving the summary screen) */
  clearLastReward: () => void;

  /** Reset all progression (for testing/debug) */
  resetProgression: () => void;
}

/** Fire-and-forget RPC call to persist progression in Supabase */
async function syncProgression(
  userId: string,
  reward: ProgressionReward,
  gameScore: number
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("update_progression", {
      p_user_id: userId,
      p_xp_earned: reward.totalXP,
      p_credits_earned: reward.creditsEarned,
      p_new_level: reward.newLevel,
      p_game_score: gameScore,
      p_best_streak: reward.bestStreak,
    });
    if (error) console.error("[TerraPin] Progression sync failed:", error.message);
  } catch (err) {
    console.error("[TerraPin] Progression sync error:", err);
  }
}

const INITIAL_STATE = {
  level: 1,
  totalXP: 0,
  terraCredits: 0,
  highestStreak: 0,
  gamesPlayed: 0,
  totalScore: 0,
  lastReward: null,
  isSyncing: false,
} as const;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      completeGame: (gameScore, rounds, timePerRound, userId) => {
        const { level, totalXP, terraCredits, highestStreak, gamesPlayed, totalScore } = get();

        const reward = calculateProgressionReward(
          gameScore,
          rounds,
          timePerRound,
          totalXP,
          level
        );

        set({
          level: reward.newLevel,
          totalXP: reward.newTotalXP,
          terraCredits: terraCredits + reward.creditsEarned,
          highestStreak: Math.max(highestStreak, reward.bestStreak),
          gamesPlayed: gamesPlayed + 1,
          totalScore: totalScore + gameScore,
          lastReward: reward,
        });

        // Fire-and-forget Supabase sync for authenticated users
        if (userId) {
          set({ isSyncing: true });
          syncProgression(userId, reward, gameScore).finally(() => {
            set({ isSyncing: false });
          });
        }

        return reward;
      },

      loadFromSupabase: async (userId) => {
        const supabase = createClient();
        const res = await supabase
          .from("profiles")
          .select("level, total_xp, terra_credits, highest_streak, games_played, total_score")
          .eq("id", userId)
          .single();

        if (res.error) {
          console.error("[TerraPin] Failed to load profile:", res.error.message);
          return;
        }

        const data = res.data as Pick<PlayerProfile, "level" | "total_xp" | "terra_credits" | "highest_streak" | "games_played" | "total_score"> | null;
        if (data) {
          set({
            level: data.level,
            totalXP: data.total_xp,
            terraCredits: data.terra_credits,
            highestStreak: data.highest_streak,
            gamesPlayed: data.games_played,
            totalScore: Number(data.total_score),
          });
        }
      },

      clearLastReward: () => set({ lastReward: null }),

      resetProgression: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: "terrapin-player",
      partialize: (state) => ({
        level: state.level,
        totalXP: state.totalXP,
        terraCredits: state.terraCredits,
        highestStreak: state.highestStreak,
        gamesPlayed: state.gamesPlayed,
        totalScore: state.totalScore,
      }),
    }
  )
);
