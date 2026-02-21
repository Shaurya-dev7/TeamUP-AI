-- Add missing columns to profiles table for admin features
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS suspended text,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS college text,
  ADD COLUMN IF NOT EXISTS hostel_city text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS skills text,
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workscore numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feedback_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hackathons_participated integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS projects_completed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges text,
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS forum_posts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS events_participated integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS teams_joined integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS saved_projects integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_days integer DEFAULT 0;

-- Create system_flags table
CREATE TABLE IF NOT EXISTS public.system_flags (
    key text PRIMARY KEY,
    value boolean NOT NULL DEFAULT true,
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Initialize default system flags
INSERT INTO public.system_flags (key, value)
VALUES 
    ('registrations_enabled', true),
    ('team_creation_enabled', true),
    ('invites_enabled', true),
    ('maintenance_mode', false),
    ('read_only_mode', false)
ON CONFLICT (key) DO NOTHING;

-- Create user_reports table
CREATE TABLE IF NOT EXISTS public.user_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- pending, resolved, dismissed
    created_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Allow admins to access user_reports
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins can do anything with user_reports" ON public.user_reports
    USING (EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin', 'senior_moderator', 'moderator')));

-- Allow admins to access system_flags
ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can update system flags" ON public.system_flags
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin')));
CREATE POLICY "Everyone can view system flags" ON public.system_flags
    FOR SELECT USING (true);
