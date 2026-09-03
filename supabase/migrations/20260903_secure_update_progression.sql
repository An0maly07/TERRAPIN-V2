-- ============================================================================
-- Security fix: update_progression() trusted a client-supplied p_user_id with
-- no ownership check. Since the function is SECURITY DEFINER (bypasses RLS)
-- and its EXECUTE grant is available to any authenticated client, any signed-in
-- user could call it with another player's UUID and overwrite that player's
-- XP/credits/level/streak/score — self-cheating and griefing other accounts.
--
-- Fix: stop accepting p_user_id from the caller entirely. Operate on
-- auth.uid() instead, matching the RLS policy already in place for direct
-- table access ("Users can update own profile ... USING (auth.uid() = id)").
-- ============================================================================

-- Drop the old signature first since the parameter list is changing.
DROP FUNCTION IF EXISTS public.update_progression(UUID, INT, INT, INT, INT, INT);

CREATE OR REPLACE FUNCTION public.update_progression(
  p_xp_earned      INT,
  p_credits_earned INT,
  p_new_level      INT,
  p_game_score     INT,
  p_best_streak    INT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'update_progression requires an authenticated session';
  END IF;

  UPDATE public.profiles
  SET
    total_xp       = total_xp + p_xp_earned,
    terra_credits  = terra_credits + p_credits_earned,
    level          = GREATEST(level, p_new_level),
    highest_streak = GREATEST(highest_streak, p_best_streak),
    games_played   = games_played + 1,
    total_score    = total_score + p_game_score,
    updated_at     = now()
  WHERE id = auth.uid()
  RETURNING * INTO result;

  RETURN result;
END;
$$;
