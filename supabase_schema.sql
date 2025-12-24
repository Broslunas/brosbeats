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
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
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
