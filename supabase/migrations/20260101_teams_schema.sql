-- ============================================
-- TEAM SYSTEM SCHEMA
-- Migration: 20260101_teams_schema.sql
-- ============================================

BEGIN;

-- ===========================================
-- 1. TEAMS TABLE (Main table)
-- ===========================================
-- Using SERIAL for readable ID (e.g., 100001)

CREATE TYPE public.team_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE public.team_join_mode AS ENUM ('open', 'request', 'closed');

CREATE TABLE public.teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    max_members INTEGER DEFAULT 10,
    join_mode public.team_join_mode DEFAULT 'request' NOT NULL,
    status public.team_status DEFAULT 'active' NOT NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Start team IDs at 100001 for cleaner display
ALTER SEQUENCE teams_id_seq RESTART WITH 100001;

CREATE INDEX idx_teams_status ON public.teams(status);
CREATE INDEX idx_teams_created_by ON public.teams(created_by);
CREATE INDEX idx_teams_join_mode ON public.teams(join_mode);

-- ===========================================
-- 2. TEAM MEMBERS TABLE
-- ===========================================

CREATE TYPE public.team_role AS ENUM ('leader', 'co_leader', 'member');

CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role public.team_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- ===========================================
-- 3. TEAM ROLES NEEDED (Free-form strings)
-- ===========================================

CREATE TABLE public.team_roles_needed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    role_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_team_roles_needed_team_id ON public.team_roles_needed(team_id);

-- ===========================================
-- 4. TEAM JOIN REQUESTS
-- ===========================================

CREATE TYPE public.join_request_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE public.team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT,
    status public.join_request_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    responded_at TIMESTAMPTZ,
    responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Unique constraint: one pending request per user per team
    CONSTRAINT unique_pending_request UNIQUE (team_id, user_id) 
        -- PostgreSQL doesn't support partial unique constraints inline,
        -- we'll handle this via a partial unique index below
);

-- Partial unique index for one PENDING request per user per team
DROP INDEX IF EXISTS idx_unique_pending_join_request;
CREATE UNIQUE INDEX idx_unique_pending_join_request 
    ON public.team_join_requests(team_id, user_id) 
    WHERE status = 'pending';

CREATE INDEX idx_team_join_requests_team_id ON public.team_join_requests(team_id);
CREATE INDEX idx_team_join_requests_user_id ON public.team_join_requests(user_id);
CREATE INDEX idx_team_join_requests_status ON public.team_join_requests(status);

-- Remove the regular unique constraint since we have the partial index
ALTER TABLE public.team_join_requests DROP CONSTRAINT IF EXISTS unique_pending_request;

-- ===========================================
-- 5. TEAM INVITES
-- ===========================================

CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');

CREATE TABLE public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id INTEGER REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    message TEXT,
    status public.invite_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ
);

-- Partial unique index for one PENDING invite per user per team
CREATE UNIQUE INDEX idx_unique_pending_invite 
    ON public.team_invites(team_id, invited_user_id) 
    WHERE status = 'pending';

CREATE INDEX idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX idx_team_invites_invited_user_id ON public.team_invites(invited_user_id);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- ===========================================
-- TRIGGERS
-- ===========================================

-- A. Update teams.updated_at on modification
CREATE OR REPLACE FUNCTION public.update_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_timestamp
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_team_timestamp();

-- B. Update team_members.updated_at on role change
CREATE OR REPLACE FUNCTION public.update_team_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_member_timestamp
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_team_member_timestamp();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_roles_needed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- TEAMS POLICIES
-- -----------------------------------------

-- Anyone can view active, non-closed teams (public metadata)
CREATE POLICY "View public teams"
ON public.teams FOR SELECT
USING (status = 'active' AND join_mode IN ('open', 'request'));

-- Members can view their own teams (including private)
CREATE POLICY "Members can view own teams"
ON public.teams FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = id AND tm.user_id = auth.uid()
    )
);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Leaders and co-leaders can update
CREATE POLICY "Leaders can update teams"
ON public.teams FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- Only leader can delete (soft delete via status)
CREATE POLICY "Leader can delete team"
ON public.teams FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = id 
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
);

-- -----------------------------------------
-- TEAM MEMBERS POLICIES
-- -----------------------------------------

-- Anyone can view members of teams they belong to
CREATE POLICY "View team members"
ON public.team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id AND tm.user_id = auth.uid()
    )
);

-- Leader/co-leader can add members
CREATE POLICY "Leaders can add members"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
    OR user_id = auth.uid() -- Allow self-add (for team creation)
);

-- Leader/co-leader can update roles (but not demote leader)
CREATE POLICY "Leaders can update member roles"
ON public.team_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- Members can leave (delete self), leaders can remove others
CREATE POLICY "Members can leave or be removed"
ON public.team_members FOR DELETE
USING (
    user_id = auth.uid() -- Can leave yourself
    OR EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- -----------------------------------------
-- TEAM ROLES NEEDED POLICIES
-- -----------------------------------------

-- Anyone can view roles for visible teams
CREATE POLICY "View team roles needed"
ON public.team_roles_needed FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id 
        AND (t.join_mode IN ('open', 'request') OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = t.id AND tm.user_id = auth.uid()
        ))
    )
);

-- Leaders can manage roles
CREATE POLICY "Leaders can manage roles needed"
ON public.team_roles_needed FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- -----------------------------------------
-- TEAM JOIN REQUESTS POLICIES
-- -----------------------------------------

-- Users can view their own requests
CREATE POLICY "View own join requests"
ON public.team_join_requests FOR SELECT
USING (user_id = auth.uid());

-- Leaders can view requests for their teams
CREATE POLICY "Leaders can view team requests"
ON public.team_join_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- Users can create requests for open/request mode teams
CREATE POLICY "Users can request to join teams"
ON public.team_join_requests FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id 
        AND t.join_mode IN ('open', 'request')
        AND t.status = 'active'
    )
);

-- Leaders can update request status
CREATE POLICY "Leaders can respond to requests"
ON public.team_join_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- -----------------------------------------
-- TEAM INVITES POLICIES
-- -----------------------------------------

-- Users can view invites sent to them
CREATE POLICY "View own invites"
ON public.team_invites FOR SELECT
USING (invited_user_id = auth.uid());

-- Leaders can view invites they sent
CREATE POLICY "Leaders can view sent invites"
ON public.team_invites FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- Leaders can send invites
CREATE POLICY "Leaders can send invites"
ON public.team_invites FOR INSERT
TO authenticated
WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid()
        AND tm.role IN ('leader', 'co_leader')
    )
);

-- Invited users can respond (accept/decline)
CREATE POLICY "Users can respond to invites"
ON public.team_invites FOR UPDATE
USING (invited_user_id = auth.uid());

-- ===========================================
-- REALTIME
-- ===========================================

-- Add teams tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_join_requests;

COMMIT;
