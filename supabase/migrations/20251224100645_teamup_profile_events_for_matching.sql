BEGIN;

create table if not exists public.profile_events (
  id bigserial primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  query text,
  created_at timestamptz not null default now(),
  constraint profile_events_event_type_check check (event_type in ('search','view_profile','follow','unfollow','message'))
);

create index if not exists profile_events_actor_id_created_at_idx on public.profile_events (actor_id, created_at desc);
create index if not exists profile_events_target_profile_id_created_at_idx on public.profile_events (target_profile_id, created_at desc);
create index if not exists profile_events_event_type_created_at_idx on public.profile_events (event_type, created_at desc);

COMMIT;