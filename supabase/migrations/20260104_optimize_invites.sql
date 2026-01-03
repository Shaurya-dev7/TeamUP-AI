-- Add index to optimize recent invite checks
CREATE INDEX IF NOT EXISTS idx_team_invites_cooldown 
ON public.team_invites (team_id, invited_user_id, created_at DESC);
