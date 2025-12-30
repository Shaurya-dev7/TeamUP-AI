-- Add is_demo flag to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
