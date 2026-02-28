/** Row shape from the `profiles` table in Supabase */
export interface PlayerProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  level: number;
  total_xp: number;
  terra_credits: number;
  highest_streak: number;
  games_played: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

/** Result of calculating progression rewards for a single completed game */
export interface ProgressionReward {
  /** Base XP from distance accuracy (sum of per-round Haversine scores) */
  baseXP: number;
  /** Bonus XP from answering quickly */
  speedBonus: number;
  /** Bonus XP from maintaining a streak of good rounds */
  streakBonus: number;
  /** Total XP = baseXP + speedBonus + streakBonus */
  totalXP: number;
  /** Best consecutive streak of good rounds (score > 2500) this game */
  bestStreak: number;
  /** TerraCredits earned this game */
  creditsEarned: number;
  /** Player's new total XP after this game */
  newTotalXP: number;
  /** Player's level before this game */
  previousLevel: number;
  /** Player's level after this game */
  newLevel: number;
  /** Whether the player leveled up this game */
  didLevelUp: boolean;
  /** Flat credit bonus awarded on level-up (0 if no level-up) */
  levelUpCreditBonus: number;
}

/** Defines the XP boundary for each level */
export interface LevelThreshold {
  level: number;
  /** Cumulative XP needed to reach this level */
  xpRequired: number;
}

/** Arguments passed to the Supabase `update_progression` RPC */
export interface UpdateProgressionArgs {
  p_user_id: string;
  p_xp_earned: number;
  p_credits_earned: number;
  p_new_level: number;
  p_game_score: number;
  p_best_streak: number;
}
