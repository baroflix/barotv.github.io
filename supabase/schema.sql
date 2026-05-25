-- ============================================================
-- Nextflix · Supabase Database Bootstrap
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0.  TABLE: allowed_emails  (must exist before the helper function)
--     Whitelist of emails permitted to use the application.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email TEXT PRIMARY KEY
);

-- ─────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────
-- 1.  HELPER: is_allowed_email()
--     Used inside every RLS policy to avoid repetition.
--     Defined AFTER allowed_emails so the body can be validated.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_allowed_email()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_emails
    WHERE email = (auth.jwt() ->> 'email')::text
  );
$$;


ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Explicitly grant SELECT so PostgREST doesn't return 403 Permission Denied
GRANT SELECT ON public.allowed_emails TO authenticated;
GRANT SELECT ON public.allowed_emails TO anon;

-- A user can only see their own email in the allowlist.
-- This is much safer and avoids recursion compared to using is_allowed_email().
DROP POLICY IF EXISTS "allowed_emails: select for allowed users" ON public.allowed_emails;
CREATE POLICY "allowed_emails: select for allowed users"
  ON public.allowed_emails
  FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email')::text);

-- No INSERT / UPDATE / DELETE from the client — manage via
-- the Supabase dashboard or service-role key.

-- ─────────────────────────────────────────────────────────────
-- 2.  TABLE: profiles
--     One row per user, auto-created via trigger (see §4).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  username   TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Explicitly grant permissions on profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Any allowed user can read all profiles (needed to show
-- comment author names).
DROP POLICY IF EXISTS "profiles: select for allowed users" ON public.profiles;
CREATE POLICY "profiles: select for allowed users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_allowed_email());

-- A user may only INSERT their own profile row.
DROP POLICY IF EXISTS "profiles: insert own row" ON public.profiles;
CREATE POLICY "profiles: insert own row"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() AND public.is_allowed_email());

-- A user may only UPDATE their own profile row.
DROP POLICY IF EXISTS "profiles: update own row" ON public.profiles;
CREATE POLICY "profiles: update own row"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND public.is_allowed_email())
  WITH CHECK (id = auth.uid() AND public.is_allowed_email());

-- A user may only DELETE their own profile row.
DROP POLICY IF EXISTS "profiles: delete own row" ON public.profiles;
CREATE POLICY "profiles: delete own row"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid() AND public.is_allowed_email());

-- ─────────────────────────────────────────────────────────────
-- 3.  TABLE: comments
--     Stores user comments keyed by movie/show id (string).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id   TEXT        NOT NULL,
  user_id    UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_movie_id_idx ON public.comments (movie_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx  ON public.comments (user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Explicitly grant permissions on comments
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;

-- Any allowed user can read all comments.
DROP POLICY IF EXISTS "comments: select for allowed users" ON public.comments;
CREATE POLICY "comments: select for allowed users"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (public.is_allowed_email());

-- An allowed user may insert their own comments.
DROP POLICY IF EXISTS "comments: insert own" ON public.comments;
CREATE POLICY "comments: insert own"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_allowed_email());

-- A user may update only their own comments.
DROP POLICY IF EXISTS "comments: update own" ON public.comments;
CREATE POLICY "comments: update own"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_allowed_email())
  WITH CHECK (user_id = auth.uid() AND public.is_allowed_email());

-- A user may delete only their own comments.
DROP POLICY IF EXISTS "comments: delete own" ON public.comments;
CREATE POLICY "comments: delete own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND public.is_allowed_email());

-- ─────────────────────────────────────────────────────────────
-- 4.  TRIGGER: auto-create profile on sign-up
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    -- Use the part of the email before the '@' as a default username
    SPLIT_PART(NEW.email, '@', 1),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
