-- First Supabase migration for the app. See docs/data-layer.md, Phase 2.
--
-- Don't run this file directly. Make a migration and paste this into it:
--   npx supabase migration new initial_schema
-- After it's been pushed, change the schema with new migrations; don't edit this file
-- or the migration again.
--
-- Tested on Postgres 17 (Supabase's version) with a stand-in for Supabase's auth schema:
-- the signup trigger, the save/collection triggers, row level security between users,
-- friend requests, ratings and friend suggestions. Storage policies aren't in here;
-- see "Media" in docs/data-layer.md.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per signed-up user. auth.users (managed by Supabase) holds the email and
-- password; this holds everything the app shows.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  name text not null,
  avatar_url text,
  bio text,
  home_country char(2),
  current_country char(2),
  interests text[] not null default '{}',
  auto_sort_saves boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  place_type text not null,
  suited_for text[] not null default '{}',
  address text not null,
  city text not null,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  website text,
  cover_image text,
  description text,
  ai_summary text,
  is_verified boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text,
  suited_for text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  type text not null check (type in ('photo', 'video')),
  storage_path text not null, -- path inside the "media" storage bucket
  caption text,
  position smallint not null default 0
);

-- The bookmark. A place is saved if there's a row here.
create table public.saves (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_id uuid references public.collections (id) on delete cascade, -- "France" inside "Europe Trip"
  name text not null,
  cover_image text,
  created_at timestamptz not null default now()
);

create table public.collection_places (
  collection_id uuid not null references public.collections (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, place_id)
);

-- One row per friend request. status 'accepted' means they're friends.
create table public.friendships (
  requester_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Only one friendship per pair, whichever way round it was sent.
create unique index friendships_one_per_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

-- Postgres doesn't index foreign keys on its own; these are the ones the app looks up by.
create index on public.reviews (place_id);
create index on public.reviews (author_id);
create index on public.review_media (review_id);
create index on public.collections (owner_id);
create index on public.collection_places (place_id);
create index on public.friendships (addressee_id);

-- ---------------------------------------------------------------------------
-- Rules the database keeps true, whatever the app sends
-- ---------------------------------------------------------------------------

-- Signing up makes the profile. signUp() passes username and name in options.data.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, name)
  values (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Putting a place in a collection also saves it.
create function public.save_when_collected()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.saves (user_id, place_id)
  select owner_id, new.place_id from public.collections where id = new.collection_id
  on conflict do nothing;
  return new;
end;
$$;

create trigger collection_places_save
  after insert on public.collection_places
  for each row execute function public.save_when_collected();

-- Unsaving a place takes it out of all of that user's collections.
create function public.uncollect_when_unsaved()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.collection_places cp
  using public.collections c
  where cp.collection_id = c.id
    and c.owner_id = old.user_id
    and cp.place_id = old.place_id;
  return old;
end;
$$;

create trigger saves_uncollect
  after delete on public.saves
  for each row execute function public.uncollect_when_unsaved();

-- ---------------------------------------------------------------------------
-- Calculated values (never stored, so they can't go stale)
-- ---------------------------------------------------------------------------

-- Computed columns: select them by name, e.g. .select('*, average_rating, friends_rating')
create function public.average_rating(place public.places)
returns numeric
language sql stable
set search_path = ''
as $$
  select round(avg(rating), 1) from public.reviews where place_id = place.id;
$$;

-- Average rating from the signed-in user's friends only.
create function public.friends_rating(place public.places)
returns numeric
language sql stable
set search_path = ''
as $$
  select round(avg(r.rating), 1)
  from public.reviews r
  join public.friendships f
    on f.status = 'accepted'
    and (select auth.uid()) in (f.requester_id, f.addressee_id)
    and r.author_id in (f.requester_id, f.addressee_id)
  where r.place_id = place.id
    and r.author_id <> (select auth.uid());
$$;

-- People the signed-in user might know: not already friends or requested,
-- sorted by shared interests, then same current country.
create function public.suggested_friends(max_results int default 10)
returns setof public.profiles
language sql stable
set search_path = ''
as $$
  select p.*
  from public.profiles p
  join public.profiles me on me.id = (select auth.uid())
  where p.id <> me.id
    and not exists (
      select 1 from public.friendships f
      where (f.requester_id = me.id and f.addressee_id = p.id)
         or (f.requester_id = p.id and f.addressee_id = me.id)
    )
  order by
    (select count(*) from unnest(p.interests) i where i = any (me.interests))
      + coalesce(p.current_country = me.current_country, false)::int desc,
    p.created_at desc
  limit max_results;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: who can read and write each row
-- (select auth.uid()) is the signed-in user's id. The extra select makes Postgres
-- work it out once per query instead of once per row.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.review_media enable row level security;
alter table public.saves enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.friendships enable row level security;

-- Profiles: anyone signed in can look; only you can edit yours.
create policy "profiles: read" on public.profiles
  for select to authenticated using (true);
create policy "profiles: edit own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Places: anyone signed in can look and add one.
create policy "places: read" on public.places
  for select to authenticated using (true);
create policy "places: add" on public.places
  for insert to authenticated with check (created_by = (select auth.uid()));

-- Reviews: anyone signed in can read; only the author can write.
create policy "reviews: read" on public.reviews
  for select to authenticated using (true);
create policy "reviews: write own" on public.reviews
  for all to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

create policy "review_media: read" on public.review_media
  for select to authenticated using (true);
create policy "review_media: write own" on public.review_media
  for all to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid())))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.author_id = (select auth.uid())));

-- Saves and collections are private to their owner.
create policy "saves: own" on public.saves
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "collections: own" on public.collections
  for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "collection_places: own" on public.collection_places
  for all to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = (select auth.uid())));

-- Friendships: accepted ones are public (for friend counts); requests only
-- show to the two people involved.
create policy "friendships: read" on public.friendships
  for select to authenticated
  using (status = 'accepted' or (select auth.uid()) in (requester_id, addressee_id));
create policy "friendships: send request" on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy "friendships: accept" on public.friendships
  for update to authenticated
  using (addressee_id = (select auth.uid())) with check (addressee_id = (select auth.uid()));
create policy "friendships: remove" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
