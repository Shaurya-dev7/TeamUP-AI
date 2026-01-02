-- Create hackathons table
create table if not exists public.hackathons (
    id uuid default gen_random_uuid() primary key,
    external_source text not null,
    external_id text not null,
    title text not null,
    description text,
    start_date timestamptz,
    end_date timestamptz,
    mode text check (mode in ('online', 'in-person', 'hybrid')),
    location text,
    platform text,
    url text,
    image text,
    cash_prize numeric,
    prize_text text,
    is_featured boolean default false,
    is_active boolean default true,
    clicks int default 0,
    views int default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    last_synced_at timestamptz default now()
);

-- Add unique constraint for upsert
alter table public.hackathons 
    add constraint hackathons_source_id_key unique (external_source, external_id);

-- Add indexes for performance
create index if not exists idx_hackathons_start_date on public.hackathons(start_date);
create index if not exists idx_hackathons_platform on public.hackathons(platform);
create index if not exists idx_hackathons_mode on public.hackathons(mode);
create index if not exists idx_hackathons_is_active on public.hackathons(is_active);

-- Enable RLS
alter table public.hackathons enable row level security;

-- Create policy for public read access
create policy "Hackathons are viewable by everyone" 
    on public.hackathons for select 
    using (true);

-- Create policy for service role sync (insert/update)
-- Note: Service role bypasses RLS, but explicit policy is good practice or strictly needed if not using service role.
-- We assume the sync script uses service role key.
