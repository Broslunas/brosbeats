-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS Table
-- Syncs with NextAuth user data (+ Spotify specifics)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  avatar_url text,
  spotify_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Persistent Tracker Columns
  total_listened_ms bigint default 0,
  last_played_at timestamp with time zone -- Cursor for the latest track we've counted
);

-- 2. PRIVACY SETTINGS Table
-- Controls profile visibility
create type privacy_status as enum ('private', 'mixed', 'public');

create table public.privacy_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  status privacy_status default 'private',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. STATS SNAPSHOTS Table
-- Stores historical stats for the user
-- JSONB is used for flexibility with complex stats data
create table public.stats_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  Snapshot_date timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Core Metrics
  total_minutes_listened bigint default 0,
  total_tracks_played int default 0,
  
  -- Top Entities (JSONB for flexibility)
  -- Structure example: [{name: "Artist", count: 100}, ...]
  top_artists jsonb default '[]'::jsonb,
  top_tracks jsonb default '[]'::jsonb,
  top_genres jsonb default '[]'::jsonb,
  
  -- Analysis Data
  diversity_score float, -- e.g. 0.0 to 1.0
  listening_clock jsonb, -- e.g. distribution by hour of day
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies (Basic Draft)
alter table public.users enable row level security;
alter table public.privacy_settings enable row level security;
alter table public.stats_snapshots enable row level security;

-- Policies can be refined later, assume authenticated users can read their own data
create policy "Users can read own data" on public.users for select using (auth.uid() = id);

-- 4. STREAMING HISTORY Table
-- Stores raw Spotify streaming history
create table public.streaming_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  played_at timestamp with time zone not null,
  track_name text,
  artist_name text,
  album_name text,
  ms_played int,
  spotify_track_uri text,
  platform text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster queries
create index if not exists streaming_history_user_id_played_at_idx on public.streaming_history(user_id, played_at);

-- 5. RPC Function to aggregate stats effectively
create or replace function public.calculate_user_stats(target_user_id uuid)
returns json
language plpgsql
as $$
declare
  total_ms bigint;
  top_artists json;
  top_tracks json;
begin
  -- 1. Total Listening Time
  select coalesce(sum(ms_played), 0) into total_ms
  from public.streaming_history
  where user_id = target_user_id;

  -- 2. Top Artists (by Time Played)
  select json_agg(t) into top_artists from (
    select artist_name as name, sum(ms_played) as ms, count(*) as play_count
    from public.streaming_history
    where user_id = target_user_id
    and artist_name is not null
    group by artist_name
    order by sum(ms_played) desc
    limit 20
  ) t;

  -- 3. Top Tracks (by Time Played)
  select json_agg(t) into top_tracks from (
    select track_name as name, artist_name as artist, sum(ms_played) as ms, count(*) as play_count
    from public.streaming_history
    where user_id = target_user_id
    and track_name is not null
    group by track_name, artist_name
    order by sum(ms_played) desc
    limit 20
  ) t;

  return json_build_object(
    'total_minutes', total_ms / 60000,
    'top_artists', coalesce(top_artists, '[]'::json),
    'top_tracks', coalesce(top_tracks, '[]'::json)
  );
end;
$$;
