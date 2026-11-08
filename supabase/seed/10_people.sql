-- People: profiles, home and travel status, settings, interests and goals.
-- Sign-up already made each account's profiles, settings and profile_locations
-- rows, so this file updates them.
--
-- The story: Folake lives in Boston and is traveling in Paris. Her account is
-- friends-only and Kenji is her close friend. Kenji lives in Tokyo and is
-- planning Rome next month. Amara is new, at home in Lagos.

update public.profiles set
  bio = 'Chasing good coffee and better views.',
  avatar_path = 'https://i.pravatar.cc/200?img=47',
  dream_trip_city_id = 'tokyo-jp',
  account_type = 'friends_only'
where id = seed.user('folake');

update public.profiles set
  avatar_path = 'https://i.pravatar.cc/200?img=12'
where id = seed.user('kenji_travels');

update public.profiles set
  bio = 'New here!',
  avatar_path = 'https://i.pravatar.cc/200?img=32'
where id = seed.user('amara');

update public.profile_locations set
  home_city_id = 'boston-us',
  status_kind = 'traveling',
  status_city_id = 'paris-fr',
  status_until = current_date + 12,
  share_close_friends = 'full',
  share_everyone = 'country'
where user_id = seed.user('folake');

update public.profile_locations set
  home_city_id = 'tokyo-jp',
  status_kind = 'planning',
  status_city_id = 'rome-it',
  status_month = date_trunc('month', current_date + interval '1 month')::date,
  share_close_friends = 'full',
  share_everyone = 'country'
where user_id = seed.user('kenji_travels');

update public.profile_locations set
  home_city_id = 'lagos-ng'
where user_id = seed.user('amara');

-- Background accounts exist to write reviews. Keep them out of Suggested
-- friends, so suggestions show the demo characters.
update public.settings set show_in_suggestions = false
where user_id in (
  seed.user('dgonzalez'), seed.user('s.whitfield'), seed.user('j_okafor'), seed.user('anneke.v'),
  seed.user('l.ferreira'), seed.user('priya_n'), seed.user('d.lindqvist'), seed.user('samir.aziz'),
  seed.user('o_mbeki'), seed.user('claire.dup'), seed.user('yuki_t'), seed.user('f.adeyemi')
);

insert into public.profile_interests (profile_id, interest_id) values
  (seed.user('folake'), seed.interest('hiking')),
  (seed.user('folake'), seed.interest('photography')),
  (seed.user('kenji_travels'), seed.interest('food')),
  (seed.user('kenji_travels'), seed.interest('photography')),
  (seed.user('amara'), seed.interest('museums')),
  (seed.user('amara'), seed.interest('hiking'))
on conflict do nothing;

-- This year's goals. Folake's reviews cover 3 countries so far.
insert into public.travel_goals (user_id, year, metric, target) values
  (seed.user('folake'), extract(year from current_date)::smallint, 'countries', 5),
  (seed.user('kenji_travels'), extract(year from current_date)::smallint, 'places', 10)
on conflict do nothing;
