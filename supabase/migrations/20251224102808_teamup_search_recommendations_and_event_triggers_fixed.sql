BEGIN;

-- Simple profile search across profile + related tables
create or replace function public.search_profiles(p_query text, p_limit int default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  match_score int
)
language sql
stable
as $$
with q as (
  select ('%' || lower(trim(p_query)) || '%')::text as pat
)
select
  p.id,
  p.username::text as username,
  coalesce(p.display_name, '') as display_name,
  coalesce(p.bio, '') as bio,
  (
    (case when lower(p.username::text) like q.pat then 6 else 0 end) +
    (case when p.display_name is not null and lower(p.display_name) like q.pat then 5 else 0 end) +
    (case when p.bio is not null and lower(p.bio) like q.pat then 2 else 0 end) +
    (case when exists (
      select 1
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.profile_id = p.id and lower(s.name::text) like q.pat
    ) then 4 else 0 end) +
    (case when exists (
      select 1
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.profile_id = p.id and lower(i.name::text) like q.pat
    ) then 3 else 0 end) +
    (case when exists (
      select 1
      from public.educations e
      where e.profile_id = p.id and lower(e.school) like q.pat
    ) then 2 else 0 end) +
    (case when exists (
      select 1
      from public.workplaces w
      where w.profile_id = p.id and lower(w.company) like q.pat
    ) then 2 else 0 end)
  )::int as match_score
from public.profiles p, q
where
  trim(p_query) <> ''
  and (
    lower(p.username::text) like q.pat
    or (p.display_name is not null and lower(p.display_name) like q.pat)
    or (p.bio is not null and lower(p.bio) like q.pat)
    or exists (
      select 1
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.profile_id = p.id and lower(s.name::text) like q.pat
    )
    or exists (
      select 1
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.profile_id = p.id and lower(i.name::text) like q.pat
    )
    or exists (
      select 1
      from public.educations e
      where e.profile_id = p.id and lower(e.school) like q.pat
    )
    or exists (
      select 1
      from public.workplaces w
      where w.profile_id = p.id and lower(w.company) like q.pat
    )
  )
order by match_score desc, p.created_at desc
limit p_limit;
$$;

-- Recommend profiles for a given user (graph + similarity scoring)
create or replace function public.recommend_profiles(p_profile_id uuid, p_limit int default 8)
returns table (
  id uuid,
  username text,
  display_name text,
  score int
)
language sql
stable
as $$
with
me as (select p_profile_id as id),
my_neighbors as (
  select following_id as other_id from public.follows where follower_id = (select id from me)
  union
  select follower_id as other_id from public.follows where following_id = (select id from me)
),
candidates as (
  select p.id, p.username::text as username, coalesce(p.display_name,'') as display_name
  from public.profiles p
  where p.id <> (select id from me)
),
candidate_neighbors as (
  select c.id as candidate_id, cn.other_id
  from candidates c
  join lateral (
    select following_id as other_id from public.follows f where f.follower_id = c.id
    union
    select follower_id as other_id from public.follows f where f.following_id = c.id
  ) cn on true
),
mutuals as (
  select cn.candidate_id as id, count(*)::int as mutual_count
  from candidate_neighbors cn
  join my_neighbors mn on mn.other_id = cn.other_id
  group by cn.candidate_id
),
shared_skills as (
  select c.id, count(*)::int as skill_count
  from candidates c
  join public.profile_skills ms on ms.profile_id = (select id from me)
  join public.profile_skills cs on cs.profile_id = c.id and cs.skill_id = ms.skill_id
  group by c.id
),
shared_interests as (
  select c.id, count(*)::int as interest_count
  from candidates c
  join public.profile_interests mi on mi.profile_id = (select id from me)
  join public.profile_interests ci on ci.profile_id = c.id and ci.interest_id = mi.interest_id
  group by c.id
),
same_school as (
  select c.id, 1::int as same_school
  from candidates c
  where exists (
    select 1
    from public.educations me_e
    join public.educations c_e on c_e.profile_id = c.id and c_e.school = me_e.school
    where me_e.profile_id = (select id from me)
  )
),
same_company as (
  select c.id, 1::int as same_company
  from candidates c
  where exists (
    select 1
    from public.workplaces me_w
    join public.workplaces c_w on c_w.profile_id = c.id and c_w.company = me_w.company
    where me_w.profile_id = (select id from me)
  )
)
select
  c.id,
  c.username,
  c.display_name,
  (
    coalesce(m.mutual_count, 0) * 5 +
    coalesce(ss.skill_count, 0) * 3 +
    coalesce(si.interest_count, 0) * 2 +
    coalesce(sc.same_school, 0) * 4 +
    coalesce(co.same_company, 0) * 4
  )::int as score
from candidates c
left join mutuals m on m.id = c.id
left join shared_skills ss on ss.id = c.id
left join shared_interests si on si.id = c.id
left join same_school sc on sc.id = c.id
left join same_company co on co.id = c.id
where (
  coalesce(m.mutual_count,0)
  + coalesce(ss.skill_count,0)
  + coalesce(si.interest_count,0)
  + coalesce(sc.same_school,0)
  + coalesce(co.same_company,0)
) > 0
order by score desc, c.username asc
limit p_limit;
$$;

-- Event triggers
create or replace function public.log_follow_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_events (actor_id, event_type, target_profile_id)
  values (new.follower_id, 'follow', new.following_id);
  return new;
end;
$$;

create or replace function public.log_unfollow_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_events (actor_id, event_type, target_profile_id)
  values (old.follower_id, 'unfollow', old.following_id);
  return old;
end;
$$;

drop trigger if exists follows_log_insert on public.follows;
create trigger follows_log_insert
after insert on public.follows
for each row execute function public.log_follow_event();

drop trigger if exists follows_log_delete on public.follows;
create trigger follows_log_delete
after delete on public.follows
for each row execute function public.log_unfollow_event();

create or replace function public.log_message_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile_events (actor_id, event_type, target_profile_id)
  select new.sender_id, 'message', cm.profile_id
  from public.chat_members cm
  where cm.chat_id = new.chat_id
    and cm.profile_id <> new.sender_id;
  return new;
end;
$$;

drop trigger if exists chat_messages_log_insert on public.chat_messages;
create trigger chat_messages_log_insert
after insert on public.chat_messages
for each row execute function public.log_message_events();

-- Realtime publication (best effort)
do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.profile_events;
  exception when duplicate_object then
    null;
  end;
exception when undefined_object then
  null;
end $$;

COMMIT;