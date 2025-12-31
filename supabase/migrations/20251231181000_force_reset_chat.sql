-- FORCE RESET CHAT RLS
-- This script forcefully removes old policies and resets RLS to guarantee a clean slate.

BEGIN;

-- 1. Temporarily Disable RLS to stop the loop immediately
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status DISABLE ROW LEVEL SECURITY;

-- 2. Drop Function explicitly
DROP FUNCTION IF EXISTS public.is_participant_of(_conversation_id uuid) CASCADE;

-- 3. Drop ALL policies on these tables (We drop by name, trying known variants)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update group details" ON public.conversations;

DROP POLICY IF EXISTS "View participants of own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Insert participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Update own participant settings" ON public.conversation_participants;

DROP POLICY IF EXISTS "View messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Send messages to own conversations" ON public.messages;
DROP POLICY IF EXISTS "Edit own messages" ON public.messages;

DROP POLICY IF EXISTS "View message statuses" ON public.message_status;
DROP POLICY IF EXISTS "Update own message status" ON public.message_status;

-- 4. Re-Create Security Definer Function
CREATE OR REPLACE FUNCTION public.is_participant_of(_conversation_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypasses RLS because it's SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = _conversation_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Ensure correct ownership to bypass RLS (postgres/dashboard user is usually owner/superuser)
ALTER FUNCTION public.is_participant_of(_conversation_id uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_participant_of TO authenticated, service_role;


-- 5. Re-Apply Policies (Clean & Recursive-Free)

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING ( public.is_participant_of(id) );

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true); 

CREATE POLICY "Admins can update group details"
ON public.conversations FOR UPDATE
USING ( public.is_participant_of(id) );


-- Participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- SIMPLE NON-RECURSIVE POLICY for seeing self (breaks the base case of recursion)
CREATE POLICY "View own participant row"
ON public.conversation_participants FOR SELECT
USING ( user_id = auth.uid() );

-- RECURSIVE-SAFE POLICY using function for seeing others
CREATE POLICY "View other participants in my conversations"
ON public.conversation_participants FOR SELECT
USING ( public.is_participant_of(conversation_id) );

CREATE POLICY "Insert participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Update own participant settings"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());


-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own conversations"
ON public.messages FOR SELECT
USING ( public.is_participant_of(conversation_id) );

CREATE POLICY "Send messages to own conversations"
ON public.messages FOR INSERT
WITH CHECK ( public.is_participant_of(conversation_id) );

CREATE POLICY "Edit own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());


-- Message Status
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View message statuses"
ON public.message_status FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.id = message_id
        AND public.is_participant_of(m.conversation_id)
    )
);

CREATE POLICY "Update own message status"
ON public.message_status FOR UPDATE
USING (user_id = auth.uid());

COMMIT;
