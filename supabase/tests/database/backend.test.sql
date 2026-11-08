-- The backend's privacy rules, the rules it keeps (triggers) and its RPCs.
-- Run with `npx supabase test db`. Everything happens in one transaction that's
-- rolled back at the end, so the database is left as it was.
--
-- The people:
--   Ana  ...01  friends-only, traveling in Paris, shares the city with close friends only
--   Ben  ...02  Ana's close friend
--   Cat  ...03  a stranger
--   Dan  ...04  blocked by Ana; signed up without a username

begin;

create extension if not exists pgtap with schema extensions;
-- pgTAP's own functions, for the signed-in and signed-out roles (rolled back with the rest)
grant execute on all functions in schema extensions to anon, authenticated;

select plan(29);

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'ana@test.local', '{"username": "test_ana", "name": "Ana"}'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'ben@test.local', '{"username": "test_ben", "name": "Ben"}'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'cat@test.local', '{"username": "test_cat", "name": "Cat"}'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'dan.d@test.local', '{}');

select is(
  (select count(*)::int from public.profiles where id::text like 'aaaaaaaa-%'), 4,
  'Signing up makes a profile');
select is(
  (select username from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000004'), 'dan.d',
  'Without a username, one is made from the email');

-- Set the scene, as the database owner (no privacy rules apply here)
update public.profiles set account_type = 'friends_only' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profile_locations
set status_kind = 'traveling', status_city_id = 'paris-fr', status_until = '2026-12-01',
    share_close_friends = 'full', share_everyone = 'country'
where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.settings set follow_lists_visibility = 'only_me'
where user_id in ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002');
insert into public.follows (follower_id, following_id) values
  ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.close_friends (owner_id, friend_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002');
insert into public.blocks (blocker_id, blocked_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004');
insert into public.collections (id, owner_id, name, is_private) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Secret', true),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Open', false);
insert into public.places (id, name, place_type, city_id) values
  ('dddddddd-0000-0000-0000-000000000001', 'Test Cafe', 'cafe', 'paris-fr');

-- ---------------------------------------------------------------------------
-- As Cat, a stranger
-- ---------------------------------------------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub": "aaaaaaaa-0000-0000-0000-000000000003", "role": "authenticated"}';

select is(
  (select p.visible_status from public.profiles p where p.id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '{"kind": "traveling", "country": "France"}'::jsonb,
  'A stranger sees only the country of a status');
select is(
  (select count(*)::int from public.profile_locations where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0,
  'Nobody else can read your location row');
select is(
  (select count(*)::int from public.settings where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0,
  'Nobody else can read your settings');
select is((select count(*)::int from public.close_friends), 0, 'Nobody else can see your close friends');
select is(
  (select count(*)::int from public.collections where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1,
  'Others see public collections, not private ones');
select is(
  (select count(*)::int from public.follows where following_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0,
  'Hidden follow lists are hidden');
select is(
  (select p.follower_count from public.profiles p where p.id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1,
  'Follower counts still count them');
select is(public.follow('aaaaaaaa-0000-0000-0000-000000000001'), 'requested',
  'Following a friends-only account sends a request');
select is(public.follow('aaaaaaaa-0000-0000-0000-000000000002'), 'following',
  'Following a public account follows straight away');
select is_empty(
  $$ update public.profiles set bio = 'hacked' where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning id $$,
  'You can''t edit someone else''s profile');
select throws_ok(
  $$ insert into public.reviews (place_id, author_id, rating)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 5) $$,
  '42501', null,
  'You can''t post as someone else');
select ok(
  public.create_review('{"place_name": "Harbour Kiosk", "city": "Porto", "country": "Portugal",
    "place_type": "Cafe", "rating": 4, "body": "Good", "suited_for": ["Solo", "Families"]}') is not null,
  'Posting about a new place adds it');
select is((select count(*)::int from public.cities where lower(name) = 'porto'), 1,
  'Posting from a new city adds the city');
select is(
  (select r.suited_for from public.reviews r join public.places p on p.id = r.place_id where p.name = 'Harbour Kiosk'),
  array['families', 'solo'],
  'Tag labels become slugs');
select ok(
  public.create_review('{"place_name": "harbour kiosk", "city": "porto", "country": "portugal",
    "place_type": "cafe", "rating": 2}') is not null,
  'Posting about the same place again works');
select is(
  (select count(*)::int from public.reviews r join public.places p on p.id = r.place_id where p.name = 'Harbour Kiosk'), 1,
  'One review per person per place');
select is(
  (select r.rating::int from public.reviews r join public.places p on p.id = r.place_id where p.name = 'Harbour Kiosk'), 2,
  'Posting again updates your review');

-- ---------------------------------------------------------------------------
-- As Ben, Ana's close friend
-- ---------------------------------------------------------------------------
set local "request.jwt.claims" to '{"sub": "aaaaaaaa-0000-0000-0000-000000000002", "role": "authenticated"}';

select is(
  (select p.visible_status from public.profiles p where p.id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '{"kind": "traveling", "country": "France", "city": "Paris", "until": "2026-12-01"}'::jsonb,
  'A close friend sees the city and dates');

-- ---------------------------------------------------------------------------
-- As Dan, whom Ana blocked
-- ---------------------------------------------------------------------------
set local "request.jwt.claims" to '{"sub": "aaaaaaaa-0000-0000-0000-000000000004", "role": "authenticated"}';

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0,
  'Someone you blocked can''t see your profile');

-- ---------------------------------------------------------------------------
-- As Ana
-- ---------------------------------------------------------------------------
set local "request.jwt.claims" to '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';

insert into public.collection_places (collection_id, place_id) values
  ('cccccccc-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001');
select is(
  (select count(*)::int from public.saves where place_id = 'dddddddd-0000-0000-0000-000000000001'), 1,
  'Putting a place in a collection saves it');

delete from public.saves where place_id = 'dddddddd-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.collection_places where place_id = 'dddddddd-0000-0000-0000-000000000001'), 0,
  'Unsaving takes it out of your collections');

update public.profiles set account_type = 'public' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select is(
  (select count(*)::int from public.follows
   where follower_id = 'aaaaaaaa-0000-0000-0000-000000000003' and following_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 1,
  'Turning friends-only off accepts waiting requests');

insert into public.blocks (blocker_id, blocked_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from public.follows
   where 'aaaaaaaa-0000-0000-0000-000000000002' in (follower_id, following_id)
     and 'aaaaaaaa-0000-0000-0000-000000000001' in (follower_id, following_id)), 0,
  'Blocking ends follows both ways');
select is((select count(*)::int from public.close_friends), 0, 'Blocking takes them off your close friends');

-- ---------------------------------------------------------------------------
-- Signed out
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
set local "request.jwt.claims" to '{"role": "anon"}';

select is(public.is_username_available('test_ana'), false, 'A taken username isn''t available');
select is(public.is_username_available('someone_new_123'), true, 'A free username is available');
select throws_ok($$ select 1 from public.places $$, '42501', null, 'Signed out, you can''t read anything');

select * from finish();
rollback;
