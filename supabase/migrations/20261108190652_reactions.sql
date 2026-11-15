-- B3: likes, comments, and the Explore page's city stats.
-- Design: docs/backend-plan.md.
--
-- Once this has been pushed, change the schema with a new migration. Never edit
-- this file after that.

create table public.review_likes (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index on public.review_likes (user_id);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index on public.review_comments (review_id);
create index on public.review_comments (author_id);

-- Computed fields: .select('*, like_count, comment_count')
create function public.like_count(review public.reviews)
returns integer
language sql stable
set search_path = ''
as $$
  select count(*)::int from public.review_likes l where l.review_id = review.id;
$$;

create function public.comment_count(review public.reviews)
returns integer
language sql stable
set search_path = ''
as $$
  select count(*)::int from public.review_comments c where c.review_id = review.id;
$$;

grant execute on function public.like_count(public.reviews), public.comment_count(public.reviews)
  to authenticated, service_role;

-- One row per city that has places, for the Explore page. Replaces the
-- grouping in src/services/cities.ts. popularity is still the placeholder
-- score from there: places count most, then reviews, then rating.
create view public.city_stats
with (security_invoker = true)
as
select
  c.id,
  c.name,
  c.country,
  c.country_code,
  coalesce(c.cover_path, (
    select best.cover_path
    from public.places best
    where best.city_id = c.id and best.cover_path is not null
    order by public.average_rating(best) desc nulls last, best.created_at
    limit 1
  )) as cover_path,
  count(distinct p.id)::int as place_count,
  count(r.id)::int as review_count,
  round(avg(r.rating), 1) as average_rating,
  array_agg(distinct p.place_type) as place_types,
  round(count(distinct p.id) * 10 + count(r.id) * 2 + coalesce(avg(r.rating), 0), 1) as popularity
from public.cities c
join public.places p on p.city_id = c.id
left join public.reviews r on r.place_id = p.id
group by c.id;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.review_likes enable row level security;
alter table public.review_comments enable row level security;

-- "Can see the review" is the reviews table's own rule (no posts by people who
-- blocked you), applied through the subquery.
create policy "review_likes: on reviews you can see" on public.review_likes
  for select to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_likes.review_id));
create policy "review_likes: like as yourself" on public.review_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.reviews r where r.id = review_likes.review_id)
  );
create policy "review_likes: unlike your own" on public.review_likes
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "review_comments: on reviews you can see" on public.review_comments
  for select to authenticated
  using (
    exists (select 1 from public.reviews r where r.id = review_comments.review_id)
    and not private.has_blocked(author_id, (select auth.uid()))
  );
create policy "review_comments: comment as yourself" on public.review_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.reviews r where r.id = review_comments.review_id)
  );
create policy "review_comments: delete your own, or any on your post" on public.review_comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.reviews r
      where r.id = review_comments.review_id and r.author_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on public.review_likes, public.review_comments, public.city_stats from anon, authenticated;

grant select, insert, delete on public.review_likes, public.review_comments to authenticated;
grant select on public.city_stats to authenticated;

grant all on public.review_likes, public.review_comments, public.city_stats to service_role;
