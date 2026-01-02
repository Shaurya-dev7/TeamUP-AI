-- Remove broken/rogue triggers on team_join_requests
-- The error 'record "new" has no field "requester_id"' indicates a broken trigger exists
-- attempting to access a non-existent column.
-- Since logic is handled in API routes and no triggers are defined in schema for this table,
-- we safely drop ALL triggers on team_join_requests.

DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'team_join_requests'
        AND event_object_schema = 'public'
    LOOP
        RAISE NOTICE 'Dropping trigger: %', t_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(t_name) || ' ON public.team_join_requests CASCADE';
    END LOOP;
END $$;
