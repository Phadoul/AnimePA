-- ============================================================
--  AnimePA – Supabase Database Schema
--  Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── 1. Auto-incrementing reference sequence ─────────────────
create sequence if not exists anime_referencia_seq start 1;

-- ─── 2. Anime master table ───────────────────────────────────
create table if not exists public.anime (
  id                uuid primary key default gen_random_uuid(),
  referencia        integer unique default nextval('anime_referencia_seq'),
  titulo            text not null,
  link_mal          text,
  link_schedule     text,
  link_ver          text,
  estado            text check (estado in ('Going','Finish','Waiting','Desc')) default 'Waiting',
  participantes     text check (participantes in ('P&A','Pedro','Asencio')),
  temporada         text,
  fecha             text,
  horario           text,
  horario_dias      text[],          -- e.g. {'L','X','V'}
  numero_episodios  integer,
  episodio_actual   integer default 0,
  nota_mal          numeric(4,2),
  agregado          timestamptz default now(),
  created_at        timestamptz default now()
);

-- ─── 3. Per-user episode progress ────────────────────────────
create table if not exists public.user_progress (
  id                uuid primary key default gen_random_uuid(),
  anime_id          uuid references public.anime(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  episodios_vistos  integer default 0,
  updated_at        timestamptz default now(),
  unique (anime_id, user_id)
);

-- ─── 4. Row Level Security ───────────────────────────────────
-- Only authenticated users can read/write
alter table public.anime enable row level security;
alter table public.user_progress enable row level security;

-- Anime: authenticated users can read all, write all
create policy "Authenticated read anime"
  on public.anime for select
  to authenticated
  using (true);

create policy "Authenticated insert anime"
  on public.anime for insert
  to authenticated
  with check (true);

create policy "Authenticated update anime"
  on public.anime for update
  to authenticated
  using (true);

create policy "Authenticated delete anime"
  on public.anime for delete
  to authenticated
  using (true);

-- User progress: users can only see/edit their own progress
create policy "User reads own progress"
  on public.user_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "User inserts own progress"
  on public.user_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "User updates own progress"
  on public.user_progress for update
  to authenticated
  using (user_id = auth.uid());

-- ─── 5. Helper: update updated_at automatically ──────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_progress_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();
