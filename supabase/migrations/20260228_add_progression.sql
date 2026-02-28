-- ============================================================================
-- TerraPin: Progression & Credits System
-- Adds XP, leveling, TerraCredits, and streak tracking to existing profiles
-- ============================================================================

-- Guard: create profiles table if it doesn't exist yet (fresh installs)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── New progression columns ─────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS level          INT          NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_xp       INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terra_credits  INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS highest_streak INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_played   INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score    BIGINT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ  NOT NULL DEFAULT now();

-- ── Indexes for leaderboard queries ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_level      ON public.profiles (level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp   ON public.profiles (total_xp DESC);

-- ── Row-Level Security ──────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read any profile (leaderboards, social features)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- Users can insert their own profile row
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Users can update only their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── Auto-create profile on signup ───────────────────────────────────────────
-- Trigger function: copies user metadata into profiles on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop + recreate to ensure latest version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Server-side function: atomic progression update ─────────────────────────
-- Called from the client after a game ends. Uses a single atomic UPDATE
-- to prevent race conditions from concurrent game completions.
CREATE OR REPLACE FUNCTION public.update_progression(
  p_user_id       UUID,
  p_xp_earned     INT,
  p_credits_earned INT,
  p_new_level     INT,
  p_game_score    INT,
  p_best_streak   INT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result public.profiles;
BEGIN
  UPDATE public.profiles
  SET
    total_xp       = total_xp + p_xp_earned,
    terra_credits  = terra_credits + p_credits_earned,
    level          = GREATEST(level, p_new_level),
    highest_streak = GREATEST(highest_streak, p_best_streak),
    games_played   = games_played + 1,
    total_score    = total_score + p_game_score,
    updated_at     = now()
  WHERE id = p_user_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;
