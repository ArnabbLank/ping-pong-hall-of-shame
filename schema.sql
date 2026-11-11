-- Ping Pong Hall of Shame: run this once in the Supabase SQL editor.
-- Public can read and add players/matches. Nobody can edit. Deleting a match needs the crew passcode.

create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 24),
  emoji      text not null default '🏓' check (char_length(emoji) <= 8),
  created_at timestamptz not null default now()
);
create unique index if not exists players_name_ci on public.players (lower(name));

create table if not exists public.matches (
  id        uuid primary key default gen_random_uuid(),
  played_on date not null default current_date,
  a_id      uuid not null references public.players(id) on delete cascade,
  b_id      uuid not null references public.players(id) on delete cascade,
  a_score   int  not null check (a_score between 0 and 99),
  b_score   int  not null check (b_score between 0 and 99),
  target    int  not null check (target in (11, 21)),
  created_at timestamptz not null default now(),
  constraint different_players check (a_id <> b_id),
  -- first to target, win by 2 (deuce past target-1)
  constraint valid_score check (
    greatest(a_score, b_score) >= target and (
      (greatest(a_score, b_score) = target and least(a_score, b_score) <= target - 2) or
      (greatest(a_score, b_score) > target and greatest(a_score, b_score) - least(a_score, b_score) = 2)
    )
  )
);

-- Row Level Security: anonymous visitors may read and insert only.
alter table public.players enable row level security;
alter table public.matches enable row level security;

drop policy if exists "read players" on public.players;
drop policy if exists "add players" on public.players;
drop policy if exists "read matches" on public.matches;
drop policy if exists "add matches" on public.matches;
create policy "read players" on public.players for select using (true);
create policy "add players"  on public.players for insert with check (true);
create policy "read matches" on public.matches for select using (true);
create policy "add matches"  on public.matches for insert with check (true);

revoke update, delete on public.players, public.matches from anon, authenticated;

-- Crew passcode lives in a table nobody can read through the API (RLS on, no policies).
create table if not exists public.crew_secret (passcode text not null);
alter table public.crew_secret enable row level security;
revoke all on public.crew_secret from anon, authenticated;
-- Set your passcode (replace the text), run once:
-- insert into public.crew_secret (passcode) values ('change-me');

create or replace function public.delete_match(match_id uuid, passcode text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.crew_secret where crew_secret.passcode = delete_match.passcode) then
    delete from public.matches where id = match_id;
    return true;
  end if;
  return false;
end;
$$;
revoke all on function public.delete_match(uuid, text) from public;
grant execute on function public.delete_match(uuid, text) to anon, authenticated;

-- Live updates for open pages.
alter publication supabase_realtime add table public.players, public.matches;
