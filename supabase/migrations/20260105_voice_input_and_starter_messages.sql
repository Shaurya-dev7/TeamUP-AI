-- Voice Input + Chat Starter Messages Migration
-- Date: 2026-01-05

BEGIN;

-- 1. Chat Starter Templates
CREATE TABLE IF NOT EXISTS public.chat_starter_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context TEXT NOT NULL, -- 'new_direct_chat', 'new_group_chat', 'new_member_joined'
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chat_starter_templates_context_check 
        CHECK (context IN ('new_direct_chat', 'new_group_chat', 'new_member_joined'))
);

-- Seed starter templates
INSERT INTO public.chat_starter_templates (context, content) VALUES
('new_direct_chat', '👋 Start your conversation! Introduce yourself and what you''re working on.'),
('new_group_chat', '🎉 Welcome to the group! Share your skills and what you''re looking to collaborate on.'),
('new_member_joined', '👋 A new member has joined! Say hello and help them get started.')
ON CONFLICT DO NOTHING;

-- 2. Voice Note Settings (feature flag) - add columns if table exists
DO $$
BEGIN
    -- Add enabled column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_note_settings' 
        AND column_name = 'enabled'
    ) THEN
        ALTER TABLE public.voice_note_settings ADD COLUMN enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- Add cooldown_seconds column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_note_settings' 
        AND column_name = 'cooldown_seconds'
    ) THEN
        ALTER TABLE public.voice_note_settings ADD COLUMN cooldown_seconds INTEGER DEFAULT 30;
    END IF;
    
    -- Add max_requests_per_minute column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'voice_note_settings' 
        AND column_name = 'max_requests_per_minute'
    ) THEN
        ALTER TABLE public.voice_note_settings ADD COLUMN max_requests_per_minute INTEGER DEFAULT 10;
    END IF;
END $$;

-- Ensure at least one row exists with defaults
INSERT INTO public.voice_note_settings (enabled, cooldown_seconds, max_requests_per_minute)
SELECT true, 30, 10
WHERE NOT EXISTS (SELECT 1 FROM public.voice_note_settings);

-- 3. Extend messages table with input_method
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'input_method'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN input_method TEXT DEFAULT 'keyboard';
        
        -- Add constraint for valid values
        ALTER TABLE public.messages 
        ADD CONSTRAINT messages_input_method_check 
        CHECK (input_method IN ('keyboard', 'voice'));
    END IF;
END $$;

-- 4. RLS Policies for new tables (public read for settings, restricted for templates)
ALTER TABLE public.chat_starter_templates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read templates
DROP POLICY IF EXISTS "Authenticated users can read starter templates" ON public.chat_starter_templates;
CREATE POLICY "Authenticated users can read starter templates"
ON public.chat_starter_templates FOR SELECT
TO authenticated
USING (is_active = true);

COMMIT;
