-- Announcements table for admin broadcast system
CREATE TABLE IF NOT EXISTS public.announcements (
    id serial PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical')),
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Everyone can read active announcements
CREATE POLICY "Anyone can view active announcements" ON public.announcements
    FOR SELECT USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins can manage announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.uid() AND ar.role IN ('super_admin', 'admin')));
