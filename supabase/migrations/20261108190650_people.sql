-- B2: people. Following, close friends, interests and goals, and the functions
-- that show one person to another. Design: docs/backend-plan.md.
--
-- Once this has been pushed, change the schema with a new migration. Never edit
-- this file after that.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  notify_posts boolean not null default false, -- the bell: tell me when they post
  notify_status boolean not null default false, -- the bell: tell me when their status changes
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index on public.follows (following_id);

-- Only used for friends-only accounts. Accepting turns it into a follow.
create table public.follow_requests (
  from_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);

create index on public.follow_requests (to_id);

-- Only the owner can see their list. A close friend has to follow the owner.
create table public.close_friends (
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

create index on public.close_friends (friend_id);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  slug text not null unique, -- 'rooftop-bars'; catches "Street Food" vs "street food"
  is_starter boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.interests (created_by);

insert into public.interests (name, slug, is_starter) values
  ('Hiking', 'hiking', true),
  ('Food', 'food', true),
  ('Photography', 'photography', true),
  ('Museums', 'museums', true),
  ('Street food', 'street-food', true),
  ('Coffee', 'coffee', true),
  ('Nature', 'nature', true),
  ('Adventure', 'adventure', true),
  ('History', 'history', true),
  ('Nightlife', 'nightlife', true),
  ('Art', 'art', true),
  ('Beaches', 'beaches', true);

create table public.profile_interests (
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create index on public.profile_interests (interest_id);

-- One goal per person per year. Progress is worked out in the app from reviews.
create table public.travel_goals (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  year smallint not null check (year between 2000 and 2100),
  metric text not null check (metric in ('countries', 'cities', 'places')),
  target smallint not null check (target > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

create trigger travel_goals_touch before update on public.travel_goals
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Private helpers: read rows the caller can't, for the policies and functions below
-- ---------------------------------------------------------------------------

create function private.follows_user(follower uuid, person uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.follows f where f.follower_id = follower and f.following_id = person);
$$;

create function private.is_close_friend(owner uuid, friend uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.close_friends c where c.owner_id = owner and c.friend_id = friend);
$$;

create function private.is_friends_only(person uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = person and p.account_type = 'friends_only');
$$;

create function private.follow_lists_public(person uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select coalesce(
    (select s.follow_lists_visibility = 'everyone' from public.settings s where s.user_id = person),
    true
  );
$$;

-- One status trimmed to one sharing level, the same way trimStatusForLevel does
-- in src/services/users.ts: hidden -> nothing, country -> no city, city -> no
-- dates, full -> everything.
create function private.status_json(loc public.profile_locations, level text)
returns jsonb
language sql stable
set search_path = ''
as $$
  select case
    when level = 'hidden' then null
    when loc.status_kind = 'home' then jsonb_build_object('kind', 'home')
    else jsonb_strip_nulls(jsonb_build_object(
      'kind', loc.status_kind,
      'country', c.country,
      'city', case when level in ('city', 'full') then c.name end,
      'until', case when level = 'full' and loc.status_kind = 'traveling' then to_char(loc.status_until, 'YYYY-MM-DD') end,
      'month', case when level = 'full' and loc.status_kind = 'planning' then to_char(loc.status_month, 'YYYY-MM') end
    ))
  end
  from (select 1) as one
  left join public.cities c on c.id = loc.status_city_id;
$$;

-- Someone's status as the signed-in user may see it: yours in full, a close
-- friend gets the owner's close-friends level, everyone else the everyone level,
-- and nothing at all if the owner blocked you.
create function private.visible_status(owner uuid)
returns jsonb
language sql stable
security definer set search_path = ''
as $$
  select case
    when owner = (select auth.uid()) then private.status_json(l, 'full')
    when private.is_close_friend(owner, (select auth.uid())) then private.status_json(l, l.share_close_friends)
    else private.status_json(l, l.share_everyone)
  end
  from public.profile_locations l
  where l.user_id = owner
    and not private.has_blocked(owner, (select auth.uid()));
$$;

-- Someone's home city at the level they allow ("Lives in" shows): city and
-- country, country only, or nothing. Yours comes back in full.
create function private.visible_home(owner uuid)
returns jsonb
language sql stable
security definer set search_path = ''
as $$
  select case
    when owner = (select auth.uid()) or s.home_visibility = 'city' then jsonb_strip_nulls(jsonb_build_object(
      'city_id', c.id, 'city', c.name, 'country', c.country, 'country_code', c.country_code
    ))
    when s.home_visibility = 'country' then jsonb_strip_nulls(jsonb_build_object(
      'country', c.country, 'country_code', c.country_code
    ))
  end
  from public.profile_locations l
  join public.cities c on c.id = l.home_city_id
  left join public.settings s on s.user_id = l.user_id
  where l.user_id = owner
    and not private.has_blocked(owner, (select auth.uid()));
$$;

-- Counts show even when someone hides their follow lists.
create function private.follower_count(person uuid)
returns integer
language sql stable
security definer set search_path = ''
as $$
  select count(*)::int from public.follows f where f.following_id = person;
$$;

create function private.following_count(person uuid)
returns integer
language sql stable
security definer set search_path = ''
as $$
  select count(*)::int from public.follows f where f.follower_id = person;
$$;

-- "Also in Lisbon" when you're both away in the same country (as far as you
-- can see), otherwise "3 mutuals" (people who follow you both).
create function private.suggestion_reason(other uuid)
returns text
language plpgsql stable
security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_mine jsonb;
  v_theirs jsonb;
  v_mutuals int;
begin
  if v_me is null or other = v_me then
    return null;
  end if;

  v_mine := private.visible_status(v_me);
  v_theirs := private.visible_status(other);
  if coalesce(v_mine ->> 'kind', 'home') <> 'home'
     and coalesce(v_theirs ->> 'kind', 'home') <> 'home'
     and v_mine ->> 'country' = v_theirs ->> 'country' then
    return 'Also in ' || coalesce(v_theirs ->> 'city', v_theirs ->> 'country');
  end if;

  select count(*) into v_mutuals
  from public.follows a
  join public.follows b on b.follower_id = a.follower_id
  where a.following_id = v_me and b.following_id = other;
  if v_mutuals > 0 then
    return v_mutuals || ' mutual' || case when v_mutuals = 1 then '' else 's' end;
  end if;

  return null;
end;
$$;

-- People the signed-in user might follow: not already followed or requested,
-- not blocked either way, and only those who allow suggestions. Shared
-- interests count one each; being away in the same country counts one more.
create function private.suggested_friend_scores(max_results int)
returns table (profile_id uuid, score int)
language sql stable
security definer set search_path = ''
as $$
  with me as (
    select (select auth.uid()) as id, private.visible_status((select auth.uid())) as status
  )
  select
    p.id,
    (
      select count(*)::int
      from public.profile_interests mine
      join public.profile_interests theirs on theirs.interest_id = mine.interest_id
      where mine.profile_id = me.id and theirs.profile_id = p.id
    )
    + case
        when me.status ->> 'kind' = 'traveling'
         and private.visible_status(p.id) ->> 'kind' = 'traveling'
         and private.visible_status(p.id) ->> 'country' = me.status ->> 'country'
        then 1 else 0
      end
  from public.profiles p
  cross join me
  join public.settings s on s.user_id = p.id and s.show_in_suggestions
  where p.id <> me.id
    and not exists (select 1 from public.follows f where f.follower_id = me.id and f.following_id = p.id)
    and not exists (select 1 from public.follow_requests r where r.from_id = me.id and r.to_id = p.id)
    and not private.has_blocked(p.id, me.id)
    and not private.has_blocked(me.id, p.id)
  order by 2 desc, p.created_at desc
  limit greatest(max_results, 0);
$$;

-- Accepting creates the follow and deletes the request.
create function private.accept_follow_request(from_user uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  delete from public.follow_requests r where r.from_id = from_user and r.to_id = v_me;
  if found then
    insert into public.follows (follower_id, following_id) values (from_user, v_me)
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function
  private.follows_user(uuid, uuid),
  private.is_close_friend(uuid, uuid),
  private.is_friends_only(uuid),
  private.follow_lists_public(uuid),
  private.status_json(public.profile_locations, text),
  private.visible_status(uuid),
  private.visible_home(uuid),
  private.follower_count(uuid),
  private.following_count(uuid),
  private.suggestion_reason(uuid),
  private.suggested_friend_scores(int),
  private.accept_follow_request(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- What the app calls
-- ---------------------------------------------------------------------------

-- Computed fields: .select('*, follower_count, visible_status, ...')
create function public.visible_status(profile public.profiles)
returns jsonb
language sql stable
set search_path = ''
as $$
  select private.visible_status(profile.id);
$$;

create function public.visible_home(profile public.profiles)
returns jsonb
language sql stable
set search_path = ''
as $$
  select private.visible_home(profile.id);
$$;

create function public.follower_count(profile public.profiles)
returns integer
language sql stable
set search_path = ''
as $$
  select private.follower_count(profile.id);
$$;

create function public.following_count(profile public.profiles)
returns integer
language sql stable
set search_path = ''
as $$
  select private.following_count(profile.id);
$$;

-- "Places I've been": how many different places they've reviewed.
create function public.place_count(profile public.profiles)
returns integer
language sql stable
set search_path = ''
as $$
  select count(distinct r.place_id)::int from public.reviews r where r.author_id = profile.id;
$$;

create function public.suggestion_reason(profile public.profiles)
returns text
language sql stable
set search_path = ''
as $$
  select private.suggestion_reason(profile.id);
$$;

-- The average rating from people you follow.
create function public.friends_rating(place public.places)
returns numeric
language sql stable
set search_path = ''
as $$
  select round(avg(r.rating), 1)
  from public.reviews r
  join public.follows f on f.following_id = r.author_id and f.follower_id = (select auth.uid())
  where r.place_id = place.id;
$$;

create function public.user_count(interest public.interests)
returns integer
language sql stable
set search_path = ''
as $$
  select count(*)::int from public.profile_interests pi where pi.interest_id = interest.id;
$$;

-- Follows a public account, or asks to follow a friends-only one.
-- Returns 'following' or 'requested'.
create function public.follow(person uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
begin
  if v_me is null then
    raise exception 'Sign in to follow people.' using errcode = '42501';
  end if;
  if private.follows_user(v_me, person) then
    return 'following';
  end if;
  if private.is_friends_only(person) then
    insert into public.follow_requests (from_id, to_id) values (v_me, person) on conflict do nothing;
    return 'requested';
  end if;
  insert into public.follows (follower_id, following_id) values (v_me, person) on conflict do nothing;
  return 'following';
end;
$$;

create function public.accept_follow_request(from_user uuid)
returns void
language sql
set search_path = ''
as $$
  select private.accept_follow_request(from_user);
$$;

create function public.suggested_friends(max_results int default 10)
returns setof public.profiles
language sql stable
set search_path = ''
as $$
  select p.*
  from private.suggested_friend_scores(max_results) s
  join public.profiles p on p.id = s.profile_id
  order by s.score desc, p.created_at desc;
$$;

-- The existing interest if one has the same slug, otherwise a new one.
create function public.add_interest(interest_name text)
returns public.interests
language plpgsql
set search_path = ''
as $$
declare
  v_slug text := private.slugify(interest_name);
  v_row public.interests;
begin
  if v_slug = '' then
    raise exception 'Name the interest.' using errcode = '22023';
  end if;
  insert into public.interests (name, slug) values (trim(interest_name), v_slug)
  on conflict (slug) do nothing;
  select * into v_row from public.interests i where i.slug = v_slug;
  return v_row;
end;
$$;

-- The starter list, plus interests at least 5 people picked, most picked first.
create function public.popular_interests(max_results int default 10)
returns setof public.interests
language sql stable
set search_path = ''
as $$
  select i.*
  from public.interests i
  cross join lateral (
    select count(*) as picks from public.profile_interests pi where pi.interest_id = i.id
  ) counted
  where i.is_starter or counted.picks >= 5
  order by counted.picks desc, i.name
  limit greatest(max_results, 0);
$$;

-- People search: username or name.
create function public.search_profiles(query text)
returns setof public.profiles
language sql stable
set search_path = ''
as $$
  select p.*
  from public.profiles p
  where coalesce(trim(query), '') <> ''
    and (
      p.username ilike '%' || private.escape_like(trim(query)) || '%'
      or p.name ilike '%' || private.escape_like(trim(query)) || '%'
    )
  order by p.username
  limit 20;
$$;

grant execute on function
  public.visible_status(public.profiles),
  public.visible_home(public.profiles),
  public.follower_count(public.profiles),
  public.following_count(public.profiles),
  public.place_count(public.profiles),
  public.suggestion_reason(public.profiles),
  public.friends_rating(public.places),
  public.user_count(public.interests),
  public.follow(uuid),
  public.accept_follow_request(uuid),
  public.suggested_friends(int),
  public.add_interest(text),
  public.popular_interests(int),
  public.search_profiles(text)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Rules the database keeps (docs/backend-plan.md, rules 5 to 7)
-- ---------------------------------------------------------------------------

-- 5. Blocking someone ends follows, requests and close-friend entries between
-- the two of you, both ways.
create function private.clean_up_after_block()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.follows f
  where (f.follower_id = new.blocker_id and f.following_id = new.blocked_id)
     or (f.follower_id = new.blocked_id and f.following_id = new.blocker_id);
  delete from public.follow_requests r
  where (r.from_id = new.blocker_id and r.to_id = new.blocked_id)
     or (r.from_id = new.blocked_id and r.to_id = new.blocker_id);
  delete from public.close_friends c
  where (c.owner_id = new.blocker_id and c.friend_id = new.blocked_id)
     or (c.owner_id = new.blocked_id and c.friend_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_clean_up after insert on public.blocks
  for each row execute function private.clean_up_after_block();

-- 6. When someone stops following you, they come off your close friends.
create function private.drop_close_friend_on_unfollow()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  delete from public.close_friends c
  where c.owner_id = old.following_id and c.friend_id = old.follower_id;
  return old;
end;
$$;

create trigger follows_drop_close_friend after delete on public.follows
  for each row execute function private.drop_close_friend_on_unfollow();

-- 7. Turning friends-only off accepts every waiting request.
create function private.accept_requests_when_public()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if old.account_type = 'friends_only' and new.account_type = 'public' then
    insert into public.follows (follower_id, following_id)
    select r.from_id, r.to_id from public.follow_requests r where r.to_id = new.id
    on conflict do nothing;
    delete from public.follow_requests r where r.to_id = new.id;
  end if;
  return new;
end;
$$;

create trigger profiles_accept_requests_when_public after update of account_type on public.profiles
  for each row execute function private.accept_requests_when_public();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.follows enable row level security;
alter table public.follow_requests enable row level security;
alter table public.close_friends enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.travel_goals enable row level security;

create policy "follows: your own, and anyone's public lists" on public.follows
  for select to authenticated
  using (
    (select auth.uid()) in (follower_id, following_id)
    or private.follow_lists_public(follower_id)
    or private.follow_lists_public(following_id)
  );
create policy "follows: follow a public account as yourself" on public.follows
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and not private.is_friends_only(following_id)
    and not private.has_blocked(following_id, (select auth.uid()))
    and not private.has_blocked((select auth.uid()), following_id)
  );
create policy "follows: only the follower changes the bell" on public.follows
  for update to authenticated
  using (follower_id = (select auth.uid())) with check (follower_id = (select auth.uid()));
create policy "follows: either person can end it" on public.follows
  for delete to authenticated
  using ((select auth.uid()) in (follower_id, following_id));

create policy "follow_requests: the two people" on public.follow_requests
  for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));
create policy "follow_requests: ask a friends-only account" on public.follow_requests
  for insert to authenticated
  with check (
    from_id = (select auth.uid())
    and private.is_friends_only(to_id)
    and not private.follows_user((select auth.uid()), to_id)
    and not private.has_blocked(to_id, (select auth.uid()))
    and not private.has_blocked((select auth.uid()), to_id)
  );
create policy "follow_requests: cancel or decline" on public.follow_requests
  for delete to authenticated
  using ((select auth.uid()) in (from_id, to_id));

create policy "close_friends: own" on public.close_friends
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "close_friends: add someone who follows you" on public.close_friends
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and private.follows_user(friend_id, (select auth.uid())));
create policy "close_friends: remove" on public.close_friends
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "interests: read" on public.interests
  for select to authenticated using (true);
create policy "interests: add your own" on public.interests
  for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_starter);

create policy "profile_interests: read" on public.profile_interests
  for select to authenticated using (true);
create policy "profile_interests: pick your own" on public.profile_interests
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "profile_interests: unpick your own" on public.profile_interests
  for delete to authenticated using (profile_id = (select auth.uid()));

create policy "travel_goals: read" on public.travel_goals
  for select to authenticated using (true);
create policy "travel_goals: add your own" on public.travel_goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "travel_goals: edit your own" on public.travel_goals
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "travel_goals: delete your own" on public.travel_goals
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on public.follows, public.follow_requests, public.close_friends, public.interests,
  public.profile_interests, public.travel_goals
  from anon, authenticated;

grant select, insert, delete on public.follows to authenticated;
grant update (notify_posts, notify_status) on public.follows to authenticated;
grant select, insert, delete on public.follow_requests, public.close_friends, public.profile_interests
  to authenticated;
grant select, insert on public.interests to authenticated;
grant select, insert, update, delete on public.travel_goals to authenticated;

grant all on public.follows, public.follow_requests, public.close_friends, public.interests,
  public.profile_interests, public.travel_goals
  to service_role;
