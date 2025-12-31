BEGIN;

-- 1. Conversations Table
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.conversation_type NOT NULL,
    title TEXT, -- Nullable for direct chats
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Participants Table
CREATE TYPE public.participant_role AS ENUM ('admin', 'member');

CREATE TABLE public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role public.participant_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_muted BOOLEAN DEFAULT false NOT NULL,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

-- Index for searching users' conversations quickly
CREATE INDEX idx_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_participants_conversation_id ON public.conversation_participants(conversation_id);

-- 3. Messages Table
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'file');

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    content TEXT, -- Can be null if it's just a file with no caption (or enforce not null based on logic)
    message_type public.message_type DEFAULT 'text' NOT NULL,
    file_url TEXT,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- For edits
    deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- 4. Message Status (Read Receipts)
CREATE TYPE public.message_status_type AS ENUM ('sent', 'delivered', 'read');

CREATE TABLE public.message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- The recipient
    status public.message_status_type DEFAULT 'sent' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_status_user_id ON public.message_status(user_id);


-- FUNCTIONS & TRIGGERS

-- A. Update conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conv_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();


-- B. Auto-create message_status for all OTHER participants
CREATE OR REPLACE FUNCTION public.handle_new_message_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.message_status (message_id, user_id, status)
    SELECT NEW.id, p.user_id, 'sent'
    FROM public.conversation_participants p
    WHERE p.conversation_id = NEW.conversation_id
    AND p.user_id <> NEW.sender_id; -- Don't create status for sender
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_message_statuses
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message_status();


-- RLS POLICIES

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

-- 1. Conversation Policies
-- Users can view conversations they are participants in
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = id
        AND p.user_id = auth.uid()
    )
);

-- Users can create conversations (typically involves inserting participants too, usually handled by API or permissive if using client-side transactions)
-- For now, we allow insert if authenticated, but better to wrap in function usually. 
-- We'll allow authenticated insert for now.
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update conversations if they are admin (for group) or just member (for direct? usually admins for groups)
CREATE POLICY "Admins can update group details"
ON public.conversations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = id
        AND p.user_id = auth.uid()
        AND (p.role = 'admin' OR type = 'direct')
    )
);


-- 2. Participant Policies
-- Users can view participants of conversations they belong to
CREATE POLICY "View participants of own conversations"
ON public.conversation_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = conversation_id
        AND p.user_id = auth.uid()
    )
);

-- Users can insert themselves or others (creation flow)
CREATE POLICY "Insert participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true); 

-- Users can update their own settings (mute/archive)
CREATE POLICY "Update own participant settings"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());


-- 3. Message Policies
-- View messages in own conversations
CREATE POLICY "View messages in own conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = conversation_id
        AND p.user_id = auth.uid()
    )
);

-- Insert messages in own conversations
CREATE POLICY "Send messages to own conversations"
ON public.messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = conversation_id
        AND p.user_id = auth.uid()
    )
);

-- Update (Edit/Delete) own messages
CREATE POLICY "Edit own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());


-- 4. Message Status Policies
-- View statuses for messages in own conversations
CREATE POLICY "View message statuses"
ON public.message_status FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants p
        JOIN public.messages m ON m.conversation_id = p.conversation_id
        WHERE m.id = message_id
        AND p.user_id = auth.uid()
    )
);

-- Update own status (e.g. marking as read)
CREATE POLICY "Update own message status"
ON public.message_status FOR UPDATE
USING (user_id = auth.uid());


-- REALTIME
-- Enable realtime for messages and status
-- Note: 'supabase_realtime' publication usually exists
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.messages, public.message_status, public.conversations;
COMMIT;

COMMIT;
