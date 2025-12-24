BEGIN;

-- Username format/normalization constraints
alter table public.profiles
  add constraint profiles_username_format_check
  check (
    username = lower(username)::citext
    and username ~ '^[a-z0-9_]{3,20}$'
  );

-- Create profile automatically on user signup using user_metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_username := nullif(trim(new.raw_user_meta_data->>'username'), '');
  v_display_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');

  -- If username not provided, do not create a profile (signup flow should provide it).
  if v_username is null then
    return new;
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, lower(v_username), v_display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

COMMIT;