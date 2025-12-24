BEGIN;

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Core profile (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique,
  display_name text,
  bio text,
  avatar_url text,
  availability_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create index if not exists profiles_username_idx on public.profiles (username);

-- Followers / following (social graph)
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);

-- Skills
create table if not exists public.skills (
  id bigserial primary key,
  name citext not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id bigint not null references public.skills (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create index if not exists profile_skills_skill_id_idx on public.profile_skills (skill_id);

-- Interests
create table if not exists public.interests (
  id bigserial primary key,
  name citext not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest_id bigint not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create index if not exists profile_interests_interest_id_idx on public.profile_interests (interest_id);

-- Education (can be multiple per profile)
create table if not exists public.educations (
  id bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  school text not null,
  degree text,
  field_of_study text,
  start_year int,
  end_year int,
  created_at timestamptz not null default now()
);

create index if not exists educations_profile_id_idx on public.educations (profile_id);

-- Workplace (can be multiple per profile)
create table if not exists public.workplaces (
  id bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  title text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists workplaces_profile_id_idx on public.workplaces (profile_id);

-- Chats (1:1 and groups)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  primary key (chat_id, profile_id)
);

create index if not exists chat_members_profile_id_idx on public.chat_members (profile_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_chat_id_created_at_idx on public.chat_messages (chat_id, created_at);
create index if not exists chat_messages_sender_id_idx on public.chat_messages (sender_id);

COMMIT;