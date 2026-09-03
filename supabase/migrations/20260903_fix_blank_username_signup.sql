-- ============================================================================
-- Fix: signup and anonymous sign-in failed with
--   23514 new row for relation "profiles" violates check constraint "username_length"
--
-- handle_new_user() coerced missing metadata to '' (empty string). An empty
-- username fails the username_length CHECK, and would also collide with the
-- UNIQUE index once a second row reached it. Raising inside the trigger rolls
-- back the auth.users insert, surfacing as "Database error saving new user".
--
-- NULL is the correct value for "not provided": CHECK passes on NULL, and
-- Postgres permits many NULLs under a UNIQUE index.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'username', '')), ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Repair any rows already written with a blank username.
UPDATE public.profiles SET username  = NULL WHERE TRIM(username)  = '';
UPDATE public.profiles SET full_name = NULL WHERE TRIM(full_name) = '';
