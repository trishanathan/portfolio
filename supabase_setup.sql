-- ========================================================
-- PRAKASH NATHAN WEBSITE - SUPABASE DATABASE SCHEMA
-- Paste this in your Supabase Dashboard -> SQL Editor -> Run
-- ========================================================

-- 1. Gallery Table
create table if not exists public.gallery (
  id text primary key,
  name text not null,
  category text not null,
  src text not null,
  note text,
  created_at timestamptz default now()
);

-- 2. Filmography Table
create table if not exists public.filmography (
  id text primary key,
  title text not null,
  role text,
  lang text,
  year text,
  poster text,
  imdb_url text,
  note text,
  highlight boolean default false,
  created_at timestamptz default now()
);

-- 3. Home Featured Slides Table
create table if not exists public.home_slides (
  id text primary key,
  title text not null,
  subtitle text,
  src text not null,
  alt text,
  created_at timestamptz default now()
);

-- 4. Press & Articles Table
create table if not exists public.articles (
  id text primary key,
  title text not null,
  publication text,
  date text,
  link text,
  image text,
  summary text,
  category text,
  created_at timestamptz default now()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
alter table public.gallery enable row level security;
alter table public.filmography enable row level security;
alter table public.home_slides enable row level security;
alter table public.articles enable row level security;

-- Allow public to read data
drop policy if exists "Allow public read gallery" on public.gallery;
create policy "Allow public read gallery" on public.gallery for select using (true);

drop policy if exists "Allow public read filmography" on public.filmography;
create policy "Allow public read filmography" on public.filmography for select using (true);

drop policy if exists "Allow public read home_slides" on public.home_slides;
create policy "Allow public read home_slides" on public.home_slides for select using (true);

drop policy if exists "Allow public read articles" on public.articles;
create policy "Allow public read articles" on public.articles for select using (true);

-- Allow full access for API operations
drop policy if exists "Allow full access gallery" on public.gallery;
create policy "Allow full access gallery" on public.gallery for all using (true) with check (true);

drop policy if exists "Allow full access filmography" on public.filmography;
create policy "Allow full access filmography" on public.filmography for all using (true) with check (true);

drop policy if exists "Allow full access home_slides" on public.home_slides;
create policy "Allow full access home_slides" on public.home_slides for all using (true) with check (true);

drop policy if exists "Allow full access articles" on public.articles;
create policy "Allow full access articles" on public.articles for all using (true) with check (true);

