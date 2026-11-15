-- Likes and comments. The mock data had none, so Feed cards would all show zero.

insert into public.review_likes (review_id, user_id)
select seed.id('review', l.review), seed.user(l.who)
from (values
  ('folake/trattoria-da-nino', 'kenji_travels'),
  ('folake/giardino-bardini', 'kenji_travels'),
  ('folake/giardino-bardini', 'claire.dup'),
  ('folake/mountain-peak-cafe', 'anneke.v'),
  ('folake/kaffeehaus-nord', 'priya_n'),
  ('kenji_travels/les-deux-alpes-lookout', 'folake'),
  ('kenji_travels/les-deux-alpes-lookout', 'j_okafor'),
  ('samir.aziz/trattoria-da-nino', 'd.lindqvist'),
  ('f.adeyemi/kaffeehaus-nord', 'yuki_t')
) as l(review, who)
on conflict do nothing;

insert into public.review_comments (id, review_id, author_id, body, created_at)
select seed.id('comment', c.key), seed.id('review', c.review), seed.user(c.who), c.body, now() - c.age
from (values
  ('kenji/da-nino', 'folake/trattoria-da-nino', 'kenji_travels', 'Adding this to the list for December.', interval '40 days'),
  ('claire/bardini', 'folake/giardino-bardini', 'claire.dup', 'Go back in April, when the wisteria is in full bloom.', interval '20 days'),
  ('folake/lookout', 'kenji_travels/les-deux-alpes-lookout', 'folake', 'Was it worth the 5:30 start?', interval '90 days'),
  ('kenji/lookout-reply', 'kenji_travels/les-deux-alpes-lookout', 'kenji_travels', 'Every minute of it.', interval '89 days')
) as c(key, review, who, body, age)
on conflict do nothing;
