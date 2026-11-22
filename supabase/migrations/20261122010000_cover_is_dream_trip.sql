-- Whether the current cover photo (cover_mode = 'custom') came from the
-- Dream Trip picker rather than an upload -- both save the exact same way
-- (cover_mode/cover_path), so there's no other way to tell them apart.
-- Lets the app re-pick or prompt for a new photo when the dream trip city
-- changes, and auto-pick a first one when Auto mode has nothing to show.
-- See docs/data-layer.md ("Dream trip cover").
alter table public.profiles
  add column cover_is_dream_trip boolean not null default false;

grant update (username, name, bio, avatar_path, avatar_hue, cover_mode, cover_path, cover_is_dream_trip,
  dream_trip_city_id, account_type)
  on public.profiles to authenticated;
