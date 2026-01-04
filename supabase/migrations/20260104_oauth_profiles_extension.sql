-- OAuth Profiles Extension Migration
-- Adds OAuth-related columns and RLS policies for profiles table

BEGIN;

-- ===========================================
-- 1. Add OAuth metadata columns to profiles
-- ===========================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider TEXT,        -- google / github / email
  ADD COLUMN IF NOT EXISTS provider_id TEXT,          -- OAuth provider user ID
  ADD COLUMN IF NOT EXISTS google_email TEXT,
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,                -- Verified email
  ADD COLUMN IF NOT EXISTS full_name TEXT,            -- Full display name
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;           -- Profile picture URL

-- ===========================================
-- 2. Ensure unique username constraint
-- ===========================================
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
ON public.profiles (username);

-- ===========================================
-- 3. Update handle_new_user() trigger for OAuth
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_email TEXT;
  v_provider TEXT;
  v_provider_id TEXT;
  v_google_email TEXT;
  v_github_username TEXT;
BEGIN
  -- Extract metadata from user registration
  v_username := NULLIF(TRIM(new.raw_user_meta_data->>'username'), '');
  v_full_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'display_name'), '')
  );
  v_avatar_url := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'picture'), '')
  );
  v_email := new.email;
  
  -- Determine auth provider (from app metadata)
  v_provider := COALESCE(
    new.raw_app_meta_data->>'provider',
    'email'
  );
  v_provider_id := new.raw_app_meta_data->>'provider_id';
  
  -- Provider-specific data
  IF v_provider = 'google' THEN
    v_google_email := new.email;
  ELSIF v_provider = 'github' THEN
    v_github_username := COALESCE(
      new.raw_user_meta_data->>'login',
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username'
    );
  END IF;
  
  -- Generate username if not provided
  IF v_username IS NULL THEN
    v_username := LOWER(REGEXP_REPLACE(SPLIT_PART(v_email, '@', 1), '[^a-z0-9_]', '_', 'g'));
    -- Ensure minimum length and uniqueness suffix
    IF LENGTH(v_username) < 3 THEN
      v_username := v_username || '_user';
    END IF;
    v_username := v_username || '_' || SUBSTR(new.id::TEXT, 1, 4);
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (
    id,
    username,
    email,
    full_name,
    name,                 -- For backward compatibility
    avatar_url,
    profile_picture_url,  -- For backward compatibility
    auth_provider,
    provider_id,
    google_email,
    github_username
  )
  VALUES (
    new.id,
    LOWER(v_username),
    v_email,
    v_full_name,
    v_full_name,
    v_avatar_url,
    v_avatar_url,
    v_provider,
    v_provider_id,
    v_google_email,
    v_github_username
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    auth_provider = COALESCE(EXCLUDED.auth_provider, profiles.auth_provider),
    google_email = COALESCE(EXCLUDED.google_email, profiles.google_email),
    github_username = COALESCE(EXCLUDED.github_username, profiles.github_username),
    updated_at = NOW();
  
  RETURN new;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===========================================
-- 4. Enable RLS and add policies for profiles
-- ===========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Anyone can view profiles (public)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile (future-proofing)
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

COMMIT;
