-- Let the "suited for" tag list grow.
--
-- THE PROBLEM
--
-- create_review() picks the tags off a post with an INNER JOIN against
-- public.suited_for_tags:
--
--   select coalesce(array_agg(distinct t.slug), '{}') into v_tags
--   from public.suited_for_tags t
--   join jsonb_array_elements_text(post -> 'suited_for') as picked(value)
--     on lower(trim(picked.value)) in (t.slug, lower(t.label));
--
-- A tag that isn't already a row doesn't match, so it's dropped. Quietly: the
-- post saves, looking fine, without the tag. That's why someone can't tag a
-- place "Bachata" today, and why they'd never find out it hadn't worked.
--
-- WHAT THIS DOES
--
-- A tag nobody has used before becomes a row instead of disappearing. The
-- same trust model as public.interests, which has let anyone signed in add one
-- since the people migration: new rows are marked as not part of the starter
-- list, so the built-in ten stay first in the pickers.
--
-- It does NOT touch place types. places.place_type is a required foreign key
-- to public.place_types, so folding that into the same list changes a column
-- on every place and everything that reads it. That's Phase 2 in
-- docs/tags-and-filters.md -- deliberately a separate migration.

-- ---------------------------------------------------------------------------
-- Who may add a tag
-- ---------------------------------------------------------------------------

-- Tells a user-made tag from the built-in ones, so pickers can still put the
-- starter list first and show new tags as new. Existing rows are the starter
-- list, hence the default on the backfill.
alter table public.suited_for_tags
  add column is_starter boolean not null default false,
  add column created_by uuid references public.profiles (id) on delete set null;

update public.suited_for_tags set is_starter = true;

create index on public.suited_for_tags (created_by);

-- Same shape as "interests: add your own": anyone signed in may add a tag, as
-- themselves, and may not pass it off as a starter one.
create policy "suited_for_tags: add your own" on public.suited_for_tags
  for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_starter);

grant insert on public.suited_for_tags to authenticated;

-- ---------------------------------------------------------------------------
-- Adding one by name
-- ---------------------------------------------------------------------------

-- The existing tag if one has the same slug, otherwise a new one. Mirrors
-- public.add_interest(), including reusing private.slugify() so "Boat Rides",
-- "boat rides" and "Boat rides" can't become three tags.
create function public.add_suited_for_tag(tag_name text)
returns public.suited_for_tags
language plpgsql
set search_path = ''
as $$
declare
  v_slug text := private.slugify(tag_name);
  v_row public.suited_for_tags;
begin
  if v_slug = '' then
    raise exception 'Name the tag.' using errcode = '22023';
  end if;

  insert into public.suited_for_tags (slug, label, created_by, is_starter)
  values (v_slug, trim(tag_name), (select auth.uid()), false)
  on conflict (slug) do nothing;

  select * into v_row from public.suited_for_tags t where t.slug = v_slug;
  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- Stop create_review() dropping unknown tags
-- ---------------------------------------------------------------------------

-- Only the tag-collecting part changes: the function now ADDS any tag it
-- doesn't recognise and then uses it, instead of joining them away. The rest
-- of create_review() is untouched, so this replaces it as it stands in
-- 20261108190649_core.sql.
--
-- NOTE FOR REVIEW: this is the one piece worth a careful read. A person can
-- now create rows in suited_for_tags just by posting, which is the point, but
-- it also means a typo becomes a permanent tag. docs/tags-and-filters.md,
-- Phase 3, has the cheap fix for that (offer the close existing tag first)
-- and it belongs in the app, not here.
create or replace function private.collect_suited_for(picked jsonb)
returns text[]
language plpgsql
set search_path = ''
as $$
declare
  v_slugs text[] := '{}';
  v_value text;
  v_slug text;
begin
  for v_value in
    select value from jsonb_array_elements_text(coalesce(picked, '[]'::jsonb)) as t(value)
  loop
    v_slug := private.slugify(v_value);
    continue when v_slug = '';

    -- An existing tag by slug OR by label, so a picker sending "Remote work"
    -- still finds the 'remote work' row rather than making a second one.
    if not exists (
      select 1 from public.suited_for_tags t
      where t.slug = v_slug or lower(t.label) = lower(trim(v_value))
    ) then
      insert into public.suited_for_tags (slug, label, created_by, is_starter)
      values (v_slug, trim(v_value), (select auth.uid()), false)
      on conflict (slug) do nothing;
    end if;

    select t.slug into v_slug
    from public.suited_for_tags t
    where t.slug = v_slug or lower(t.label) = lower(trim(v_value))
    limit 1;

    if v_slug is not null and not (v_slug = any (v_slugs)) then
      v_slugs := v_slugs || v_slug;
    end if;
  end loop;

  return v_slugs;
end;
$$;

revoke all on function private.collect_suited_for(jsonb) from public;

-- create_review() again, as it stands in 20261108190649_core.sql with the one
-- block swapped for the call above. Everything else is byte-for-byte the
-- original, so a reviewer can diff the two and see only that change.
create or replace function public.create_review(post jsonb)
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

  -- CHANGED: was an inner join against suited_for_tags, which silently threw
  -- away any tag that wasn't already a row. This adds the unknown ones
  -- instead, so the list grows as people post.
  v_tags := private.collect_suited_for(post -> 'suited_for');

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

