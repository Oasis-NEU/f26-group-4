-- Follows, requests and close friends, moved over from the mock data that used
-- to live in src/services/follows.ts and src/services/settings.ts.

insert into public.follows (follower_id, following_id, notify_posts, created_at)
select seed.user(f.follower), seed.user(f.following), f.notify_posts, now() - f.age
from (values
  ('kenji_travels', 'folake', false, interval '80 days'),
  ('folake', 'kenji_travels', true, interval '79 days'),
  -- A few followers, so the counts aren't all 1. Anneke also follows Amara,
  -- which makes her "1 mutual" when Folake sees Amara.
  ('anneke.v', 'folake', false, interval '60 days'),
  ('l.ferreira', 'folake', false, interval '40 days'),
  ('priya_n', 'folake', false, interval '20 days'),
  ('anneke.v', 'amara', false, interval '10 days'),
  ('claire.dup', 'kenji_travels', false, interval '12 days')
) as f(follower, following, notify_posts, age)
on conflict do nothing;

-- Folake is friends-only, so Amara's follow is waiting in the inbox.
insert into public.follow_requests (from_id, to_id, created_at) values
  (seed.user('amara'), seed.user('folake'), now() - interval '3 days')
on conflict do nothing;

-- Kenji follows Folake, so he can be her close friend: he sees her city and dates.
insert into public.close_friends (owner_id, friend_id) values
  (seed.user('folake'), seed.user('kenji_travels'))
on conflict do nothing;
