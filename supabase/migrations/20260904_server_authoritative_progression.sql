-- ============================================================================
-- Security fix: progression was client-authoritative.
--
-- update_progression() accepted client-computed XP, credits, level, score and
-- streak and simply added them. Any authenticated session (anonymous guests
-- included) could call it with arbitrary values. Separately, the row-level
-- UPDATE policy on profiles let a user write total_xp / level / terra_credits
-- directly, bypassing the RPC entirely. And GREATEST(level, p_new_level) made
-- a level computed from another account's cached XP permanently sticky.
--
-- Fix:
--   * complete_game() takes round FACTS (guess, actual, timeSpent) and
--     recomputes score, XP, level and credits server-side using the same
--     curve as src/lib/progression.ts. Level is derived from XP, never trusted.
--   * Column-level UPDATE grants: users may edit identity columns only.
--   * EXECUTE revoked from anon/PUBLIC.
-- ============================================================================

DROP FUNCTION IF EXISTS public.update_progression(INT, INT, INT, INT, INT);
DROP FUNCTION IF EXISTS public.update_progression(UUID, INT, INT, INT, INT, INT);

-- Level from cumulative XP: floor(50 * (level-1)^1.75) is the threshold for
-- `level`; the player's level is the highest threshold they have met (cap 100).
CREATE OR REPLACE FUNCTION public.level_for_xp(p_xp INT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT MAX(l)
       FROM generate_series(1, 100) AS l
      WHERE p_xp >= FLOOR(50 * POWER(l - 1, 1.75))::INT),
    1);
$$;

CREATE OR REPLACE FUNCTION public.complete_game(
  p_mode           TEXT,
  p_time_per_round INT,
  p_rounds         JSONB
  -- [{ "guess": {"lat","lng"} | null, "actual": {"lat","lng"}, "timeSpent": n }]
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r            JSONB;
  n_rounds     INT;
  g_lat        DOUBLE PRECISION;
  g_lng        DOUBLE PRECISION;
  a_lat        DOUBLE PRECISION;
  a_lng        DOUBLE PRECISION;
  h            DOUBLE PRECISION;
  dist_km      DOUBLE PRECISION;
  round_score  INT;
  game_score   INT := 0;
  base_xp      INT;
  speed_xp     INT := 0;
  cur_streak   INT := 0;
  best_streak  INT := 0;
  time_spent   INT;
  xp_earned    INT;
  old_row      public.profiles;
  new_xp       INT;
  new_level    INT;
  credits      INT;
  result       public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'complete_game requires an authenticated session';
  END IF;
  IF p_mode NOT IN ('classic', 'campaign') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;
  IF p_time_per_round NOT IN (60, 120) THEN
    RAISE EXCEPTION 'invalid time per round';
  END IF;
  IF p_rounds IS NULL OR jsonb_typeof(p_rounds) <> 'array' THEN
    RAISE EXCEPTION 'rounds must be an array';
  END IF;

  n_rounds := jsonb_array_length(p_rounds);
  IF n_rounds < 1 OR n_rounds > 5 THEN
    RAISE EXCEPTION 'invalid round count';
  END IF;

  FOR r IN SELECT * FROM jsonb_array_elements(p_rounds) LOOP
    a_lat := (r->'actual'->>'lat')::DOUBLE PRECISION;
    a_lng := (r->'actual'->>'lng')::DOUBLE PRECISION;
    IF a_lat IS NULL OR a_lng IS NULL
       OR abs(a_lat) > 90 OR abs(a_lng) > 180 THEN
      RAISE EXCEPTION 'invalid actual position';
    END IF;

    IF jsonb_typeof(r->'guess') = 'object' THEN
      g_lat := (r->'guess'->>'lat')::DOUBLE PRECISION;
      g_lng := (r->'guess'->>'lng')::DOUBLE PRECISION;
      IF g_lat IS NULL OR g_lng IS NULL
         OR abs(g_lat) > 90 OR abs(g_lng) > 180 THEN
        RAISE EXCEPTION 'invalid guess position';
      END IF;

      -- Haversine, R = 6371 km — mirrors src/lib/geo.ts
      h := power(sin(radians(a_lat - g_lat) / 2), 2)
         + cos(radians(g_lat)) * cos(radians(a_lat))
         * power(sin(radians(a_lng - g_lng) / 2), 2);
      dist_km := 6371 * 2 * atan2(sqrt(h), sqrt(1 - h));
      round_score := GREATEST(0, LEAST(5000, round(5000 * exp(-dist_km / 2000))::INT));
    ELSE
      -- Timed out without placing a pin.
      round_score := 0;
    END IF;

    game_score := game_score + round_score;

    time_spent := LEAST(p_time_per_round, GREATEST(0, COALESCE((r->>'timeSpent')::INT, p_time_per_round)));
    speed_xp   := speed_xp + FLOOR(30.0 * (p_time_per_round - time_spent) / p_time_per_round)::INT;

    IF round_score > 2500 THEN
      cur_streak  := cur_streak + 1;
      best_streak := GREATEST(best_streak, cur_streak);
    ELSE
      cur_streak := 0;
    END IF;
  END LOOP;

  base_xp   := FLOOR(game_score * 0.04)::INT;
  xp_earned := base_xp + speed_xp + best_streak * best_streak * 10;

  SELECT * INTO old_row FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile row missing for %', auth.uid();
  END IF;

  new_xp    := old_row.total_xp + xp_earned;
  new_level := public.level_for_xp(new_xp);
  credits   := FLOOR(xp_earned * 0.1)::INT
             + COALESCE(
                 (SELECT SUM(50 * l)::INT
                    FROM generate_series(old_row.level + 1, new_level) AS l),
                 0);

  UPDATE public.profiles SET
    total_xp       = new_xp,
    level          = new_level,
    terra_credits  = terra_credits + credits,
    highest_streak = GREATEST(highest_streak, best_streak),
    games_played   = games_played + 1,
    total_score    = total_score + game_score,
    updated_at     = now()
  WHERE id = auth.uid()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_game(TEXT, INT, JSONB) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_game(TEXT, INT, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.level_for_xp(INT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.level_for_xp(INT) TO authenticated;

-- Close the direct-write hole. The RLS policy stays row-scoped; column grants
-- restrict WHICH columns a user may touch on their own row.
REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT  UPDATE (username, full_name, updated_at) ON public.profiles TO authenticated;
