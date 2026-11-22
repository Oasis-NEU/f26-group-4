-- Badges are meant to be seen: everyone sees everyone's earned badges on
-- their Badges tab, same as reviews ("reviews: read, except by people who
-- blocked you"). Only the person who earned a badge can write it, same as
-- before -- this only widens who can read.
drop policy "user_badges: read your own" on public.user_badges;

create policy "user_badges: read, except by people who blocked you" on public.user_badges
  for select to authenticated
  using (not private.has_blocked(user_id, (select auth.uid())));
