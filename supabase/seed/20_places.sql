-- Places, reviews and review photos, moved over from the mock data that used to
-- live in src/services/places.ts.
--
-- Places don't belong to an account, so they're upserted by key: running this
-- again replaces them instead of adding copies. Websites are left empty (the
-- mocks pointed at example.com), so the Website button hides. Photos are
-- placeholder links for now; real files in supabase/seed/photos/ can replace them.

insert into public.places
  (id, name, place_type, suited_for, address, city_id, latitude, longitude, cover_path, description, ai_summary, is_verified, created_at)
values
  (seed.id('place', 'mountain-peak-cafe'), 'Mountain Peak Café', 'cafe', array['solo', 'skiers', 'remote work'],
    '123 Alpine Road, Chamonix', 'chamonix-fr', 45.9237, 6.8694, 'https://picsum.photos/id/1018/800/600',
    'A cozy café at the base of the slopes with great coffee and a view of Mont Blanc.',
    'Visitors keep mentioning the view and the coffee. It gets busy right after the lifts open, so most people suggest going early.',
    true, now() - interval '10 days'),
  (seed.id('place', 'les-deux-alpes-lookout'), 'Les Deux Alpes Lookout', 'excursion', array['adventure', 'skiers', 'photography'],
    'Route du Belvédère, Les Deux Alpes', 'les-deux-alpes-fr', 45.0110, 6.1220, 'https://picsum.photos/id/1036/800/600',
    'A viewpoint above the treeline. Best just after sunrise, before the lifts get busy.',
    'Everyone says the same thing: go at sunrise. The walk up takes about forty minutes and gets crowded by mid-morning.',
    true, now() - interval '20 days'),
  (seed.id('place', 'cafe-belle-rive'), 'Café Belle Rive', 'cafe', array['solo', 'remote work'],
    '8 Quai du Mont Blanc, Geneva', 'geneva-ch', 46.2093, 6.1490, 'https://picsum.photos/id/225/800/600',
    'Quiet in the mornings, with plug sockets at most tables.',
    'A reliable spot to work from in the morning. People mention the lake view and the plug sockets, and that it fills up at lunch.',
    true, now() - interval '30 days'),
  (seed.id('place', 'trattoria-da-nino'), 'Trattoria da Nino', 'restaurant', array['groups', 'families'],
    'Via Garibaldi 14, Florence', 'florence-it', 43.7735, 11.2440, 'https://picsum.photos/id/292/800/600',
    'Family-run, cash only, no bookings after 8pm.',
    'Reviews agree on two things: bring cash, and come before eight. The back room is quieter if you are in a group.',
    true, now() - interval '40 days'),
  (seed.id('place', 'giardino-bardini'), 'Giardino Bardini', 'garden', array['solo', 'couples', 'photography'],
    'Costa San Giorgio 2, Florence', 'florence-it', 43.7637, 11.2582, 'https://picsum.photos/id/152/800/600',
    'Terraced garden with a view back over the river. Quietest on weekday mornings.',
    'Quieter than the gardens closer to the centre. Most people recommend a weekday morning, and say the climb up is steeper than it looks.',
    true, now() - interval '50 days'),
  (seed.id('place', 'kaffeehaus-nord'), 'Kaffeehaus Nord', 'cafe', array['solo', 'remote work', 'budget'],
    'Nordstraße 44, Berlin', 'berlin-de', 52.5320, 13.3830, 'https://picsum.photos/id/326/800/600',
    'Big tables, cheap filter coffee, no music.',
    'Cheap, plain and quiet. People come here to work and say the big shared tables are the whole appeal.',
    false, now() - interval '60 days')
on conflict (id) do update set
  name = excluded.name,
  place_type = excluded.place_type,
  suited_for = excluded.suited_for,
  address = excluded.address,
  city_id = excluded.city_id,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  cover_path = excluded.cover_path,
  description = excluded.description,
  ai_summary = excluded.ai_summary,
  is_verified = excluded.is_verified,
  created_at = excluded.created_at;

-- One review per person per place. Review keys are '<username>/<place key>'.
insert into public.reviews (id, place_id, author_id, rating, body, suited_for, created_at, updated_at)
select seed.id('review', r.author || '/' || r.place), seed.id('place', r.place), seed.user(r.author),
  r.rating, r.body, r.tags, now() - r.age, now() - r.age
from (values
  ('folake', 'mountain-peak-cafe', 5, 'Got here at 8 and had the terrace to myself. The view is the whole point.', array['solo'], interval '59 days'),
  ('dgonzalez', 'mountain-peak-cafe', 4, 'Good wifi, worked here all afternoon. Loud around lunch.', array[]::text[], interval '45 days'),
  ('s.whitfield', 'mountain-peak-cafe', 5, 'Best pain au chocolat of the trip.', array[]::text[], interval '30 days'),

  ('kenji_travels', 'les-deux-alpes-lookout', 5, 'Left at 5:30 and made it for first light. Worth every step.', array[]::text[], interval '99 days'),
  ('anneke.v', 'les-deux-alpes-lookout', 5, 'Bring layers, it is much colder at the top than at the lift station.', array[]::text[], interval '70 days'),
  ('j_okafor', 'les-deux-alpes-lookout', 4, 'Busy by 10am. Still a great view, just not a quiet one.', array[]::text[], interval '40 days'),

  ('l.ferreira', 'cafe-belle-rive', 4, 'Took the corner table by the window and stayed three hours. Nobody minded.', array[]::text[], interval '80 days'),
  ('amara', 'cafe-belle-rive', 4, 'Coffee is fine, the view is the reason to come.', array[]::text[], interval '116 days'),
  ('priya_n', 'cafe-belle-rive', 5, 'Avoid 12 to 2, it gets loud. Otherwise perfect for a work morning.', array[]::text[], interval '25 days'),

  ('folake', 'trattoria-da-nino', 5, 'Six of us in the back room, no booking, no problem at 7pm.', array[]::text[], interval '49 days'),
  ('d.lindqvist', 'trattoria-da-nino', 4, 'Cash only caught us out. There is an ATM around the corner.', array[]::text[], interval '60 days'),
  ('samir.aziz', 'trattoria-da-nino', 5, 'Best meal of the trip and the cheapest.', array[]::text[], interval '15 days'),

  ('folake', 'giardino-bardini', 5, 'Had the wisteria tunnel to myself on a Tuesday at nine.', array[]::text[], interval '34 days'),
  ('o_mbeki', 'giardino-bardini', 4, 'Steeper than I expected. Good shoes, not sandals.', array[]::text[], interval '65 days'),
  ('claire.dup', 'giardino-bardini', 4, 'The cafe at the top has the view everyone photographs.', array[]::text[], interval '20 days'),

  ('folake', 'kaffeehaus-nord', 4, 'No music, no rush. I got a full day of work done here.', array[]::text[], interval '27 days'),
  ('yuki_t', 'kaffeehaus-nord', 3, 'Coffee is nothing special but it is two euros.', array[]::text[], interval '50 days'),
  ('f.adeyemi', 'kaffeehaus-nord', 4, 'Only two plug sockets for the whole room, so get there early.', array[]::text[], interval '10 days')
) as r(author, place, rating, body, tags, age)
on conflict do nothing;

-- Photos. Keys are '<review key>/<number>'.
insert into public.review_media (id, review_id, kind, path, caption, position)
select seed.id('photo', m.review || '/' || m.position), seed.id('review', m.review), 'photo', m.path, m.caption, m.position
from (values
  ('folake/mountain-peak-cafe', 0, 'https://picsum.photos/id/1015/800/600', 'Empty terrace'),
  ('s.whitfield/mountain-peak-cafe', 0, 'https://picsum.photos/id/1016/800/600', 'The pastry case'),
  ('kenji_travels/les-deux-alpes-lookout', 0, 'https://picsum.photos/id/1036/800/600', 'First light'),
  ('kenji_travels/les-deux-alpes-lookout', 1, 'https://picsum.photos/id/1037/800/600', 'Sunrise over the valley'),
  ('kenji_travels/les-deux-alpes-lookout', 2, 'https://picsum.photos/id/1039/800/600', null),
  ('l.ferreira/cafe-belle-rive', 0, 'https://picsum.photos/id/431/800/600', 'Corner table'),
  ('folake/trattoria-da-nino', 0, 'https://picsum.photos/id/312/800/600', 'The back room'),
  ('folake/giardino-bardini', 0, 'https://picsum.photos/id/160/800/600', 'Wisteria tunnel')
) as m(review, position, path, caption)
on conflict do nothing;
