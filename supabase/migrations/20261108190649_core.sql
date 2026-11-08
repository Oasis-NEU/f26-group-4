-- B1: the core of the backend. Design: docs/backend-plan.md.
--
-- The fixed lists, the parts of a person every other table needs, places and
-- posts, saving, and the `media` storage bucket.
--
-- Once this has been pushed, change the schema with a new migration. Never edit
-- this file after that.

-- ---------------------------------------------------------------------------
-- Setup
-- ---------------------------------------------------------------------------

-- Functions that read rows the caller can't (`security definer`) live in
-- `private`, which the API doesn't expose. The app reaches them only through
-- functions in `public`.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- Postgres lets everyone run a new function, signed-out visitors included, and
-- older projects also hand every new table to the API roles. Turn both off:
-- every table and function below grants exactly what it needs.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- Keeps an `updated_at` column current.
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- "Rooftop Bars!" -> "rooftop-bars"
create function private.slugify(value text)
returns text
language sql immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Makes typed text safe inside an ilike pattern: "50%" matches "50%", not "50 anything".
create function private.escape_like(value text)
returns text
language sql immutable
set search_path = ''
as $$
  select replace(replace(replace(value, '\', '\\'), '%', '\%'), '_', '\_');
$$;

grant execute on function private.slugify(text), private.escape_like(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Fixed lists: changed only by migrations
-- ---------------------------------------------------------------------------

-- The shared city list behind "Lives in", "Dream trip", travel status and places.
create table public.cities (
  id text primary key, -- readable, e.g. 'boston-us'
  name text not null check (char_length(trim(name)) between 1 and 80),
  country text not null check (char_length(trim(country)) between 1 and 80), -- full name: 'United States'
  country_code char(2), -- 'US', for the flag. Empty for cities people add.
  latitude double precision,
  longitude double precision,
  cover_path text, -- the Explore tile; falls back to the best-rated place's cover
  created_by uuid default auth.uid(), -- foreign key added below, once profiles exists
  created_at timestamptz not null default now()
);

-- One Boston per country, whatever the capitalization.
create unique index cities_name_country_key on public.cities (lower(name), lower(country));

insert into public.cities (id, name, country, country_code, latitude, longitude) values
  ('boston-us', 'Boston', 'United States', 'US', 42.3601, -71.0589),
  ('new-york-us', 'New York', 'United States', 'US', 40.7128, -74.0060),
  ('paris-fr', 'Paris', 'France', 'FR', 48.8566, 2.3522),
  ('chamonix-fr', 'Chamonix', 'France', 'FR', 45.9237, 6.8694),
  ('les-deux-alpes-fr', 'Les Deux Alpes', 'France', 'FR', 45.0055, 6.1222),
  ('rome-it', 'Rome', 'Italy', 'IT', 41.9028, 12.4964),
  ('florence-it', 'Florence', 'Italy', 'IT', 43.7696, 11.2558),
  ('tokyo-jp', 'Tokyo', 'Japan', 'JP', 35.6762, 139.6503),
  ('lagos-ng', 'Lagos', 'Nigeria', 'NG', 6.5244, 3.3792),
  ('lisbon-pt', 'Lisbon', 'Portugal', 'PT', 38.7223, -9.1393),
  ('berlin-de', 'Berlin', 'Germany', 'DE', 52.5200, 13.4050),
  ('geneva-ch', 'Geneva', 'Switzerland', 'CH', 46.2044, 6.1432),
  ('barcelona-es', 'Barcelona', 'Spain', 'ES', 41.3874, 2.1686),
  ('london-gb', 'London', 'United Kingdom', 'GB', 51.5072, -0.1276);

-- The place types behind the filters and Upload's picker. `category` feeds the
-- Badges tab's traveler type. Emojis stay in src/utils/tag-emoji.ts.
create table public.place_types (
  slug text primary key, -- what places store: 'cafe'
  label text not null, -- what Upload shows: 'Cafe'
  category text not null default 'Other' check (category in ('Food', 'Outdoors', 'Culture', 'Other')),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.place_types (slug, label, category, sort_order) values
  ('cafe', 'Cafe', 'Food', 1),
  ('restaurant', 'Restaurant', 'Food', 2),
  ('excursion', 'Excursion', 'Outdoors', 3),
  ('garden', 'Garden', 'Outdoors', 4),
  ('sport', 'Sport', 'Outdoors', 5),
  ('museum', 'Museum', 'Culture', 6),
  ('landmark', 'Landmark', 'Culture', 7),
  ('other', 'Other', 'Other', 8);

-- The "suited for" tags. Slugs are the words the app shows ('remote work').
create table public.suited_for_tags (
  slug text primary key,
  label text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.suited_for_tags (slug, label, sort_order) values
  ('solo', 'Solo', 1),
  ('friends', 'Friends', 2),
  ('families', 'Families', 3),
  ('couples', 'Couples', 4),
  ('groups', 'Groups', 5),
  ('adventure', 'Adventure', 6),
  ('skiers', 'Skiers', 7),
  ('photography', 'Photography', 8),
  ('remote work', 'Remote work', 9),
  ('budget', 'Budget', 10);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

-- One per user: what anyone signed in may see. Made by the sign-up trigger.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._]{3,30}$'),
  name text not null check (char_length(trim(name)) between 1 and 50),
  bio text check (char_length(bio) <= 160),
  avatar_path text, -- in the media bucket. Missing means initials.
  avatar_hue smallint check (avatar_hue between 0 and 359), -- the initials' background color
  cover_mode text not null default 'auto' check (cover_mode in ('auto', 'custom', 'none')),
  cover_path text, -- used when cover_mode is 'custom'
  dream_trip_city_id text references public.cities (id) on delete set null,
  -- Here, not in settings, because other people need it to show Follow or Request.
  account_type text not null default 'public' check (account_type in ('public', 'friends_only')),
  created_at timestamptz not null default now()
);

alter table public.cities
  add constraint cities_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

-- Postgres doesn't index foreign keys by itself. These keep deletes and lookups fast.
create index on public.cities (created_by);
create index on public.profiles (dream_trip_city_id);

-- Where you live and where you are. Only you can read your row; everyone else
-- gets a trimmed copy through visible_home and visible_status (next migration).
create table public.profile_locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  home_city_id text references public.cities (id) on delete set null,
  status_kind text not null default 'home' check (status_kind in ('home', 'traveling', 'planning')),
  status_city_id text references public.cities (id),
  status_until date, -- traveling: "until Nov 20"
  status_month date, -- planning: the first day of the month
  share_close_friends text not null default 'full' check (share_close_friends in ('hidden', 'country', 'city', 'full')),
  share_everyone text not null default 'country' check (share_everyone in ('hidden', 'country', 'city', 'full')),
  status_updated_at timestamptz not null default now(),
  check (status_kind = 'home' or status_city_id is not null)
);

create index on public.profile_locations (home_city_id);
create index on public.profile_locations (status_city_id);

-- Your private settings. Only you can read or change your row.
create table public.settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  default_share_close_friends text not null default 'full' check (default_share_close_friends in ('hidden', 'country', 'city', 'full')),
  default_share_everyone text not null default 'country' check (default_share_everyone in ('hidden', 'country', 'city', 'full')),
  map_visibility text not null default 'everyone' check (map_visibility in ('everyone', 'close_friends', 'only_me')),
  home_visibility text not null default 'city' check (home_visibility in ('city', 'country', 'hidden')),
  follow_lists_visibility text not null default 'everyone' check (follow_lists_visibility in ('everyone', 'only_me')),
  new_collections_private boolean not null default false,
  show_in_suggestions boolean not null default true,
  findable_by_contact boolean not null default false,
  notifications_paused boolean not null default false,
  notify_new_follower boolean not null default true,
  notify_likes_comments boolean not null default true,
  notify_close_friend_status boolean not null default true,
  notify_trip_overlap boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Who blocked whom. Only the blocker can see it. Most read rules check it.
create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index on public.blocks (blocked_id);

-- Has `blocker` blocked `person`? Reads blocks, which only the blocker can see.
create function private.has_blocked(blocker uuid, person uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.blocks b where b.blocker_id = blocker and b.blocked_id = person);
$$;

grant execute on function private.has_blocked(uuid, uuid) to authenticated, service_role;

-- Signing up makes your profiles, settings and profile_locations rows.
-- signUp() passes username and name in options.data. A user added in the
-- dashboard has neither, so they get a username made from their email instead
-- of the trigger failing, which would stop the user being created at all.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_base text;
begin
  if coalesce(v_username, '') = '' then
    v_base := left(regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9._]', '', 'g'), 24);
    if char_length(v_base) < 3 then
      v_base := 'user' || v_base;
    end if;
    v_username := v_base;
    while exists (select 1 from public.profiles p where p.username = v_username) loop
      v_username := v_base || floor(random() * 10000)::int;
    end loop;
  end if;

  insert into public.profiles (id, username, name)
  values (new.id, v_username, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), v_username));
  insert into public.settings (user_id) values (new.id);
  insert into public.profile_locations (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger settings_touch before update on public.settings
  for each row execute function private.touch_updated_at();

-- status_updated_at moves only when the status itself changes.
create function private.touch_status_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.status_kind, new.status_city_id, new.status_until, new.status_month)
     is distinct from (old.status_kind, old.status_city_id, old.status_until, old.status_month) then
    new.status_updated_at := now();
  end if;
  return new;
end;
$$;

create trigger profile_locations_status_touch before update on public.profile_locations
  for each row execute function private.touch_status_updated_at();

-- Whether a username is free. Works signed out, for the Create account form.
-- Your own current username counts as free.
create function private.username_taken(wanted text)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.username = lower(trim(wanted))
      and p.id is distinct from (select auth.uid())
  );
$$;

create function public.is_username_available(username text)
returns boolean
language sql stable
set search_path = ''
as $$
  select not private.username_taken(username);
$$;

grant execute on function private.username_taken(text) to anon, authenticated, service_role;
grant execute on function public.is_username_available(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Places and posts
-- ---------------------------------------------------------------------------

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  place_type text not null references public.place_types (slug),
  suited_for text[] not null default '{}', -- slugs from suited_for_tags; new reviews add theirs
  address text not null default '',
  city_id text not null references public.cities (id),
  -- Optional: a place without coordinates just stays off the map.
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  website text,
  cover_path text, -- falls back to the newest photo from its reviews
  description text,
  ai_summary text, -- written by an Edge Function later; people can't set it
  is_verified boolean not null default false, -- set by us in the dashboard; people can't set it
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.places (city_id);
create index on public.places (place_type);
create index on public.places (created_by);
create index on public.places using gin (suited_for);

-- One person's post about one place. One review per person per place.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  suited_for text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, author_id)
);

create index on public.reviews (author_id);

create trigger reviews_touch before update on public.reviews
  for each row execute function private.touch_updated_at();

-- A photo on a review. `path` is inside the media bucket (or a full https URL
-- for seeded placeholders).
create table public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  kind text not null default 'photo' check (kind in ('photo', 'video')),
  path text not null,
  caption text check (char_length(caption) <= 300),
  position smallint not null default 0,
  created_at timestamptz not null default now()
);

create index on public.review_media (review_id);

-- A new review adds its suited-for tags to its place. Runs as the function's
-- owner, since people can't edit places.
create function private.add_review_tags_to_place()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.places p
  set suited_for = array(select distinct tag from unnest(p.suited_for || new.suited_for) as tag order by tag)
  where p.id = new.place_id
    and not (new.suited_for <@ p.suited_for);
  return new;
end;
$$;

create trigger reviews_tag_place
  after insert or update of suited_for on public.reviews
  for each row execute function private.add_review_tags_to_place();

-- Computed fields: select them by name, e.g. .select('*, average_rating, review_count')
create function public.average_rating(place public.places)
returns numeric
language sql stable
set search_path = ''
as $$
  select round(avg(r.rating), 1) from public.reviews r where r.place_id = place.id;
$$;

create function public.review_count(place public.places)
returns integer
language sql stable
set search_path = ''
as $$
  select count(*)::int from public.reviews r where r.place_id = place.id;
$$;

grant execute on function public.average_rating(public.places), public.review_count(public.places)
  to authenticated, service_role;

-- Feed, Map and Upload's suggestions. Matches the place name or city name;
-- empty filters match everything. Returns places, so .select('*, average_rating')
-- still works on the result.
create function public.search_places(query text default null, types text[] default null, tags text[] default null)
returns setof public.places
language sql stable
set search_path = ''
as $$
  select p.*
  from public.places p
  join public.cities c on c.id = p.city_id
  where (
      coalesce(trim(query), '') = ''
      or p.name ilike '%' || private.escape_like(trim(query)) || '%'
      or c.name ilike '%' || private.escape_like(trim(query)) || '%'
    )
    and (coalesce(cardinality(types), 0) = 0 or p.place_type = any (types))
    and (coalesce(cardinality(tags), 0) = 0 or p.suited_for && tags)
  order by p.created_at desc;
$$;

grant execute on function public.search_places(text, text[], text[]) to authenticated, service_role;

-- Upload's Post button. In one go: finds or adds the city, finds or adds the
-- place (same name in the same city), adds or updates your review (one per
-- place), and adds the photos you already uploaded. If anything fails,
-- nothing is saved. Returns the place's id.
--
-- post: { place_id?, place_name, address, city, country, latitude?, longitude?,
--         place_type, suited_for: [], rating, body, media: [{ path, caption? }] }
-- Place types and tags can come as labels ('Families') or slugs ('families').
create function public.create_review(post jsonb)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_place uuid := nullif(post ->> 'place_id', '')::uuid;
  v_place_name text := nullif(trim(post ->> 'place_name'), '');
  v_city_name text := nullif(trim(post ->> 'city'), '');
  v_country text := nullif(trim(post ->> 'country'), '');
  v_rating int := (post ->> 'rating')::int;
  v_type text;
  v_tags text[];
  v_city text;
  v_review uuid;
  v_next_position int;
begin
  if v_user is null then
    raise exception 'Sign in to post.' using errcode = '42501';
  end if;
  if v_rating is null or v_rating not between 1 and 5 then
    raise exception 'Choose a rating from 1 to 5.' using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct t.slug), '{}') into v_tags
  from public.suited_for_tags t
  join jsonb_array_elements_text(coalesce(post -> 'suited_for', '[]'::jsonb)) as picked(value)
    on lower(trim(picked.value)) in (t.slug, lower(t.label));

  if v_place is null then
    select pt.slug into v_type
    from public.place_types pt
    where lower(trim(post ->> 'place_type')) in (pt.slug, lower(pt.label));
    if v_type is null then
      raise exception 'Choose a place type.' using errcode = '22023';
    end if;
    if v_place_name is null or v_city_name is null or v_country is null then
      raise exception 'A new place needs a name, city and country.' using errcode = '22023';
    end if;

    select c.id into v_city
    from public.cities c
    where lower(c.name) = lower(v_city_name) and lower(c.country) = lower(v_country);
    if v_city is null then
      v_city := private.slugify(v_city_name || ' ' || v_country);
      insert into public.cities (id, name, country) values (v_city, v_city_name, v_country);
    end if;

    select p.id into v_place
    from public.places p
    where p.city_id = v_city and lower(p.name) = lower(v_place_name)
    order by p.created_at
    limit 1;
    if v_place is null then
      insert into public.places (name, place_type, suited_for, address, city_id, latitude, longitude)
      values (
        v_place_name, v_type, v_tags, coalesce(trim(post ->> 'address'), ''), v_city,
        (post ->> 'latitude')::double precision, (post ->> 'longitude')::double precision
      )
      returning id into v_place;
    end if;
  end if;

  insert into public.reviews (place_id, author_id, rating, body, suited_for)
  values (v_place, v_user, v_rating, nullif(trim(post ->> 'body'), ''), v_tags)
  on conflict (place_id, author_id) do update
    set rating = excluded.rating, body = excluded.body, suited_for = excluded.suited_for
  returning id into v_review;

  -- New photos go after any the review already has.
  select coalesce(max(m.position) + 1, 0) into v_next_position
  from public.review_media m
  where m.review_id = v_review;

  insert into public.review_media (review_id, kind, path, caption, position)
  select v_review, 'photo', photo ->> 'path', nullif(trim(photo ->> 'caption'), ''), v_next_position + n::int - 1
  from jsonb_array_elements(coalesce(post -> 'media', '[]'::jsonb)) with ordinality as photos(photo, n)
  where coalesce(photo ->> 'path', '') <> '';

  return v_place;
end;
$$;

grant execute on function public.create_review(jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Saving
-- ---------------------------------------------------------------------------

-- The bookmark. A place is saved if there's a row here.
create table public.saves (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index on public.saves (place_id);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  parent_id uuid references public.collections (id) on delete cascade, -- "France" inside "Europe Trip"
  name text not null check (char_length(trim(name)) between 1 and 60),
  emoji text,
  cover_path text, -- falls back to the first place's image
  -- Left empty on insert, it's filled from the owner's new_collections_private setting.
  is_private boolean check (is_private is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.collections (owner_id);
create index on public.collections (parent_id);

create table public.collection_places (
  collection_id uuid not null references public.collections (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, place_id)
);

create index on public.collection_places (place_id);

create trigger collections_touch before update on public.collections
  for each row execute function private.touch_updated_at();

-- A new collection is private if the owner's setting says so, unless the app chose.
create function private.default_collection_privacy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_private is null then
    new.is_private := coalesce(
      (select s.new_collections_private from public.settings s where s.user_id = new.owner_id),
      false
    );
  end if;
  return new;
end;
$$;

create trigger collections_default_privacy before insert on public.collections
  for each row execute function private.default_collection_privacy();

-- Collections nest one level deep, and only inside your own.
create function private.check_collection_nesting()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.parent_id = new.id
     or exists (
       select 1 from public.collections c
       where c.id = new.parent_id and (c.parent_id is not null or c.owner_id <> new.owner_id)
     ) then
    raise exception 'Collections only nest one level deep, inside your own collections.' using errcode = '23514';
  end if;
  if exists (select 1 from public.collections c where c.parent_id = new.id) then
    raise exception 'A collection that holds others can''t go inside another.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger collections_nesting before insert or update of parent_id on public.collections
  for each row execute function private.check_collection_nesting();

-- Putting a place in a collection also saves it.
-- These two run as the function's owner: they also fire while an account is
-- being deleted, when the caller is the Auth service rather than the user.
-- They only ever touch the collection owner's own rows.
create function private.save_when_collected()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.saves (user_id, place_id)
  select c.owner_id, new.place_id from public.collections c where c.id = new.collection_id
  on conflict do nothing;
  return new;
end;
$$;

create trigger collection_places_save after insert on public.collection_places
  for each row execute function private.save_when_collected();

-- Unsaving a place takes it out of all of that user's collections.
create function private.uncollect_when_unsaved()
returns trigger
language plpgsql
security definer set search_path = ''
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

create trigger saves_uncollect after delete on public.saves
  for each row execute function private.uncollect_when_unsaved();

-- Is this collection private? Policies on collections use it to check a
-- parent without reading their own table (which would loop forever).
create function private.collection_is_private(collection uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select coalesce((select c.is_private from public.collections c where c.id = collection), true);
$$;

grant execute on function private.collection_is_private(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row level security: who can read and write each row.
-- (select auth.uid()) is the signed-in user. The extra select makes Postgres
-- work it out once per query instead of once per row.
-- ---------------------------------------------------------------------------

alter table public.cities enable row level security;
alter table public.place_types enable row level security;
alter table public.suited_for_tags enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_locations enable row level security;
alter table public.settings enable row level security;
alter table public.blocks enable row level security;
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.review_media enable row level security;
alter table public.saves enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;

create policy "cities: read" on public.cities
  for select to authenticated using (true);
create policy "cities: add" on public.cities
  for insert to authenticated with check (created_by = (select auth.uid()));

create policy "place_types: read" on public.place_types
  for select to authenticated using (true);
create policy "suited_for_tags: read" on public.suited_for_tags
  for select to authenticated using (true);

create policy "profiles: read, except people who blocked you" on public.profiles
  for select to authenticated using (not private.has_blocked(id, (select auth.uid())));
create policy "profiles: edit own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "profile_locations: own" on public.profile_locations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profile_locations: edit own" on public.profile_locations
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "settings: own" on public.settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "settings: edit own" on public.settings
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "blocks: own" on public.blocks
  for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

create policy "places: read" on public.places
  for select to authenticated using (true);
create policy "places: add" on public.places
  for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_verified and ai_summary is null);

-- Each table has one read policy. Writes get their own insert, update and delete
-- policies, since a "for all" policy would count as a second read policy and
-- slow every read down.
create policy "reviews: read, except by people who blocked you" on public.reviews
  for select to authenticated using (not private.has_blocked(author_id, (select auth.uid())));
create policy "reviews: add as yourself" on public.reviews
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy "reviews: edit own" on public.reviews
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "reviews: delete own" on public.reviews
  for delete to authenticated using (author_id = (select auth.uid()));

create policy "review_media: read with its review" on public.review_media
  for select to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_media.review_id));
create policy "review_media: add to own reviews" on public.review_media
  for insert to authenticated
  with check (exists (select 1 from public.reviews r where r.id = review_media.review_id and r.author_id = (select auth.uid())));
create policy "review_media: edit on own reviews" on public.review_media
  for update to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_media.review_id and r.author_id = (select auth.uid())))
  with check (exists (select 1 from public.reviews r where r.id = review_media.review_id and r.author_id = (select auth.uid())));
create policy "review_media: delete from own reviews" on public.review_media
  for delete to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_media.review_id and r.author_id = (select auth.uid())));

create policy "saves: own" on public.saves
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "collections: yours, and others' public ones" on public.collections
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (
      not is_private
      and not private.has_blocked(owner_id, (select auth.uid()))
      and (parent_id is null or not private.collection_is_private(parent_id))
    )
  );
create policy "collections: add your own" on public.collections
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "collections: edit your own" on public.collections
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "collections: delete your own" on public.collections
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "collection_places: read with its collection" on public.collection_places
  for select to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_places.collection_id));
create policy "collection_places: add to your own" on public.collection_places
  for insert to authenticated
  with check (exists (
    select 1 from public.collections c
    where c.id = collection_places.collection_id and c.owner_id = (select auth.uid())
  ));
create policy "collection_places: remove from your own" on public.collection_places
  for delete to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_places.collection_id and c.owner_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Grants: what the API roles may try at all. RLS above still decides which rows.
-- anon (signed out) gets nothing.
-- ---------------------------------------------------------------------------

revoke all on public.cities, public.place_types, public.suited_for_tags, public.profiles,
  public.profile_locations, public.settings, public.blocks, public.places, public.reviews,
  public.review_media, public.saves, public.collections, public.collection_places
  from anon, authenticated;

grant select on public.cities, public.place_types, public.suited_for_tags, public.profiles,
  public.places to authenticated;
grant insert on public.cities, public.places to authenticated;
grant update (username, name, bio, avatar_path, avatar_hue, cover_mode, cover_path, dream_trip_city_id, account_type)
  on public.profiles to authenticated;
grant select on public.profile_locations to authenticated;
grant update (home_city_id, status_kind, status_city_id, status_until, status_month, share_close_friends, share_everyone)
  on public.profile_locations to authenticated;
grant select on public.settings to authenticated;
grant update (default_share_close_friends, default_share_everyone, map_visibility, home_visibility,
  follow_lists_visibility, new_collections_private, show_in_suggestions, findable_by_contact,
  notifications_paused, notify_new_follower, notify_likes_comments, notify_close_friend_status, notify_trip_overlap)
  on public.settings to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.reviews, public.review_media, public.collections
  to authenticated;
grant select, insert, delete on public.saves, public.collection_places to authenticated;

grant all on public.cities, public.place_types, public.suited_for_tags, public.profiles,
  public.profile_locations, public.settings, public.blocks, public.places, public.reviews,
  public.review_media, public.saves, public.collections, public.collection_places
  to service_role;

-- ---------------------------------------------------------------------------
-- Storage: one public bucket, a folder per user (<user id>/avatar/...,
-- <user id>/cover/..., <user id>/reviews/...). Demo photos live in seed/.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: see own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: replace in own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: delete from own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
