-- Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel_city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text; -- Stored as comma-separated string
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hackathons_participated integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS projects_completed integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS achievements text;
