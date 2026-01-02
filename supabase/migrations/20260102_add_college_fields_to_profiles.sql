-- Add college columns to profiles table

DO $$ 
BEGIN
    -- Add college_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'college_id') THEN
        ALTER TABLE public.profiles ADD COLUMN college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL;
    END IF;

    -- Add college_name_raw if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'college_name_raw') THEN
        ALTER TABLE public.profiles ADD COLUMN college_name_raw TEXT;
    END IF;
END $$;
