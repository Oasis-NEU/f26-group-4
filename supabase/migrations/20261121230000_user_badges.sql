-- Badges a user has earned. Rules live in the app (src/services/badges.ts),
-- calculated from data we already have (reviews, places, cities, follows,
-- collections). This table only stores WHICH badge/level each person has
-- reached, when, and whether the "you earned a badge" pop-up has shown it
-- yet -- see docs/data-layer.md ("Badges").
--
-- One row per person per badge: level goes up in place (3 -> 5 countries is
-- the same row, not a new one), and seen_at clears back to null whenever the
-- level changes, so levelling up shows the pop-up again.
create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  level smallint not null default 1 check (level >= 1),
  earned_at timestamptz not null default now(), -- when this level was first reached
  seen_at timestamptz, -- null until the pop-up for this level has shown
  -- True for badges computed once, retroactively, when badges first shipped
  -- (so day-one users don't get a flood of individual pop-ups for things
  -- they did before badges existed). Set by the app, not a default here.
  backfilled boolean not null default false,
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

-- Earned client-side from your own data and written by you -- same shape as
-- saves/settings, not an admin-only table.
create policy "user_badges: read your own" on public.user_badges
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "user_badges: earn your own" on public.user_badges
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "user_badges: update your own" on public.user_badges
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.user_badges from anon, authenticated;

grant select, insert, update on public.user_badges to authenticated;

grant all on public.user_badges to service_role;
