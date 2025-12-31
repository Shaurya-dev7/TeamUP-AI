-- FINAL FIX for Chat Permissions and Recursion
-- This script drops old policies and re-implements them using a secure, non-recursive function.

BEGIN;

-- 1. Ensure the Security Definer function exists and is correct
CREATE OR REPLACE FUNCTION public.is_participant_of(_conversation_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS
SET search_path = public
AS $$
BEGIN
  -- This query runs with elevated privileges, bypassing RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = _conversation_id 
    AND user_id = (select auth.uid())
  );
END;
$$;

-- 2. Drop POTENTIALLY problematic policies (covers both old and new names)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "View participants of own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "View messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "View message statuses" ON public.message_status;

-- 3. Re-create Conversations Policy (using function to be safe)
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
    public.is_participant_of(id)
);

-- 4. Re-create Participants Policy (using function to avoid recursion)
CREATE POLICY "View participants of own conversations"
ON public.conversation_participants FOR SELECT
USING (
    public.is_participant_of(conversation_id)
);

-- 5. Re-create Messages Policy
CREATE POLICY "View messages in own conversations"
ON public.messages FOR SELECT
USING (
    public.is_participant_of(conversation_id)
);

-- 6. Re-create Message Status Policy
CREATE POLICY "View message statuses"
ON public.message_status FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id
        AND public.is_participant_of(m.conversation_id)
    )
);

-- 7. Grant access to the function
GRANT EXECUTE ON FUNCTION public.is_participant_of TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_participant_of TO service_role;

COMMIT;
