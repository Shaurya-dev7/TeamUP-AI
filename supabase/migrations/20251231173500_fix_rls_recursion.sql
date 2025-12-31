-- Fix infinite recursion in conversation_participants policy
-- We use a SECURITY DEFINER function to check participation without triggering RLS loops

BEGIN;

-- 1. Create a secure function to check participation
CREATE OR REPLACE FUNCTION public.is_participant_of(_conversation_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public -- Secure search path
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = _conversation_id 
    AND user_id = (select auth.uid())
  );
END;
$$;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "View participants of own conversations" ON public.conversation_participants;

-- 3. Re-create the policy using the secure function
CREATE POLICY "View participants of own conversations"
ON public.conversation_participants FOR SELECT
USING (
    public.is_participant_of(conversation_id)
);

COMMIT;
