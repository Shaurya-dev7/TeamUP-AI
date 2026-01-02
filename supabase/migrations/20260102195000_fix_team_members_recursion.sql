-- Fix infinite recursion in team_members policy
-- We use a SECURITY DEFINER function to check membership without triggering RLS loops

BEGIN;

-- 1. Create a secure function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id int)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.team_members 
    WHERE team_id = _team_id 
    AND user_id = (select auth.uid())
  );
END;
$$;

-- 2. Drop the recursive policy on team_members
DROP POLICY IF EXISTS "View team members" ON public.team_members;

-- 3. Re-create the policy using the secure function
CREATE POLICY "View team members"
ON public.team_members FOR SELECT
USING (
    public.is_team_member(team_id)
);

COMMIT;
