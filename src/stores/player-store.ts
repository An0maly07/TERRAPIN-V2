import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProgressionReward,
  PlayerProfile,
  CompleteGameArgs,
  CompleteGameRound,
} from "@/types/profile";
import type { GameMode, RoundResult } from "@/types/game";
import { calculateProgressionReward } from "@/lib/progression";
import { createClient } from "@/lib/supabase/client";

type ProfileColumns = Pick<
  PlayerProfile,
  "level" | "total_xp" | "terra_credits" | "highest_streak" | "games_played" | "total_score"
>;

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
   *
   * Guests: progression is computed and stored locally.
   * Signed-in users: the server recomputes everything from round facts via the
   * `complete_game` RPC and the returned row becomes the source of truth. The
   * local calculation is only used for the optimistic reward animation.
   */
  completeGame: (
    gameScore: number,
    rounds: ReadonlyArray<RoundResult>,
    timePerRound: number,
    mode: GameMode,
    userId?: string
  ) => ProgressionReward;

  /** Load profile from Supabase (source of truth for authenticated users) */
  loadFromSupabase: (userId: string) => Promise<void>;

  /** Clear the last reward (called when leaving the summary screen) */
  clearLastReward: () => void;

  /** Reset all progression (for testing/debug) */
  resetProgression: () => void;
}

function toRoundFacts(rounds: ReadonlyArray<RoundResult>): CompleteGameRound[] {
  return rounds.map((r) => ({
    guess: r.guessPosition ? { lat: r.guessPosition.lat, lng: r.guessPosition.lng } : null,
    actual: { lat: r.actualPosition.lat, lng: r.actualPosition.lng },
    timeSpent: r.timeSpent,
  }));
}

/** Server-authoritative sync. Resolves to the updated profile row, or null on failure. */
async function syncProgression(
  mode: GameMode,
  rounds: ReadonlyArray<RoundResult>,
  timePerRound: number
): Promise<ProfileColumns | null> {
  try {
    const supabase = createClient();
    const args: CompleteGameArgs = {
      p_mode: mode,
      p_time_per_round: timePerRound,
      p_rounds: toRoundFacts(rounds),
    };
    const { data, error } = await supabase.rpc("complete_game", args);
    if (error) {
      console.error("[TerraPin] Progression sync failed:", error.message);
      return null;
    }
    return (data as ProfileColumns | null) ?? null;
  } catch (err) {
    console.error("[TerraPin] Progression sync error:", err);
    return null;
  }
}

function fromRow(row: ProfileColumns) {
  return {
    level: row.level,
    totalXP: row.total_xp,
    terraCredits: row.terra_credits,
    highestStreak: row.highest_streak,
    gamesPlayed: row.games_played,
    totalScore: Number(row.total_score),
  };
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

      completeGame: (gameScore, rounds, timePerRound, mode, userId) => {
        const { level, totalXP } = get();

        const reward = calculateProgressionReward(
          gameScore,
          rounds,
          timePerRound,
          totalXP,
          level
        );

        if (!userId) {
          // Guest: local-only progression.
          set((s) => ({
            level: reward.newLevel,
            totalXP: reward.newTotalXP,
            terraCredits: s.terraCredits + reward.creditsEarned,
            highestStreak: Math.max(s.highestStreak, reward.bestStreak),
            gamesPlayed: s.gamesPlayed + 1,
            totalScore: s.totalScore + gameScore,
            lastReward: reward,
          }));
          return reward;
        }

        // Signed in: show the optimistic reward, then adopt the server's row.
        set({ lastReward: reward, isSyncing: true });
        syncProgression(mode, rounds, timePerRound)
          .then((row) => {
            if (row) set(fromRow(row));
          })
          .finally(() => set({ isSyncing: false }));

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

        const data = res.data as ProfileColumns | null;
        if (data) set(fromRow(data));
      },

      clearLastReward: () => set({ lastReward: null }),

      resetProgression: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: "terrapin-player",
      // Hydrated explicitly on the client (see StoreHydrator) so SSR markup and
      // the first client render agree — avoids hydration text mismatches.
      skipHydration: true,
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
