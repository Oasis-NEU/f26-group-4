-- Saves and collections, moved over from the mock data that used to live in
-- src/services/collections.ts. Putting a place in a collection also saves it.

insert into public.collections (id, owner_id, parent_id, name, cover_path, is_private, created_at)
select seed.id('collection', c.key), seed.user(c.owner), case when c.parent is null then null else seed.id('collection', c.parent) end,
  c.name, c.cover, c.is_private, now() - c.age
from (values
  -- Parents first: a sub-collection's parent has to exist already.
  ('folake/europe-trip', 'folake', null, 'Europe Trip', 'https://picsum.photos/id/1036/800/600', false, interval '90 days'),
  ('folake/france', 'folake', 'folake/europe-trip', 'France', 'https://picsum.photos/id/1018/800/600', false, interval '89 days'),
  ('folake/italy', 'folake', 'folake/europe-trip', 'Italy', 'https://picsum.photos/id/292/800/600', false, interval '88 days'),
  ('folake/coffee-shops', 'folake', null, 'Coffee Shops', 'https://picsum.photos/id/225/800/600', false, interval '60 days'),
  ('folake/someday', 'folake', null, 'Someday', null, true, interval '30 days'),
  ('kenji/italy-in-december', 'kenji_travels', null, 'Italy in December', null, false, interval '14 days')
) as c(key, owner, parent, name, cover, is_private, age)
on conflict do nothing;

insert into public.collection_places (collection_id, place_id)
select seed.id('collection', cp.collection), seed.id('place', cp.place)
from (values
  ('folake/france', 'mountain-peak-cafe'),
  ('folake/france', 'les-deux-alpes-lookout'),
  ('folake/italy', 'trattoria-da-nino'),
  ('folake/italy', 'giardino-bardini'),
  ('folake/coffee-shops', 'mountain-peak-cafe'),
  ('folake/coffee-shops', 'cafe-belle-rive'),
  ('folake/someday', 'giardino-bardini'),
  ('kenji/italy-in-december', 'trattoria-da-nino'),
  ('kenji/italy-in-december', 'giardino-bardini')
) as cp(collection, place)
on conflict do nothing;

-- Saved but not in any collection, so the Saved page's loose section has something in it.
insert into public.saves (user_id, place_id) values
  (seed.user('folake'), seed.id('place', 'kaffeehaus-nord'))
on conflict do nothing;
