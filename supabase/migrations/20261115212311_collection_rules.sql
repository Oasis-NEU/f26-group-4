-- Collections that fill themselves ("auto add"), and nesting three deep
-- (Europe Trip > France > Paris). From Ruby's collections-and-explore work.
-- Design: docs/data-layer.md ("Collections and auto add") and
-- docs/backend-plan.md ("Saving").
--
-- The matching stays in the app (src/lib/collection-rules.ts): a rule like
-- "anywhere in Europe" needs the region lookup in src/lib/regions.ts, and the
-- New collection screen's "3 places already match" preview has to agree with
-- what actually happens. savePlace() in src/services/collections.ts runs it
-- after each new save. Moving it into an `after insert` trigger on saves is in
-- docs/data-layer.md, Phase 3.
--
-- Once this has been pushed, change the schema with a new migration. Never edit
-- this file after that.

-- What a collection is about, and whether saving a matching place drops it in.
-- `rules` is CollectionRules from src/types/collection.ts, every list optional:
--   {"regions": [...], "countries": [...], "cities": [...], "placeTypes": [...], "vibes": [...]}
-- Null means a plain collection you fill by hand.
alter table public.collections
  add column rules jsonb check (rules is null or jsonb_typeof(rules) = 'object'),
  add column auto_add boolean not null default false,
  add constraint collections_auto_add_needs_rules check (not auto_add or rules is not null);

-- Places someone took out of one of their auto add collections by hand, so
-- auto add doesn't put them straight back. Its own table, not a column on
-- collections, because only the owner should see it: other people can read
-- your public collections.
create table public.collection_exclusions (
  collection_id uuid not null references public.collections (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, place_id)
);

create index on public.collection_exclusions (place_id);

-- Putting a place back in a collection clears its exclusion, so a place you
-- removed and then added again by hand isn't left marked as removed.
create function private.unexclude_when_collected()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.collection_exclusions e
  where e.collection_id = new.collection_id and e.place_id = new.place_id;
  return new;
end;
$$;

create trigger collection_places_unexclude after insert on public.collection_places
  for each row execute function private.unexclude_when_collected();

-- Collections nest three deep now, and still only inside your own. This
-- replaces the one-level check from the core migration; the
-- collections_nesting trigger keeps calling it.
create or replace function private.check_collection_nesting()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  max_depth constant integer := 3;
  parent_depth integer;
  makes_a_loop boolean;
  levels_below integer;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id
     or not exists (
       select 1 from public.collections c
       where c.id = new.parent_id and c.owner_id = new.owner_id
     ) then
    raise exception 'Collections only go inside your own collections.' using errcode = '23514';
  end if;

  -- How deep the new parent sits (1 = top level), and whether walking up from
  -- it comes back to this collection, which would make a loop. The depth
  -- limit on the walk stops it going round a loop forever.
  with recursive above as (
    select c.id, c.parent_id, 1 as steps_up
    from public.collections c
    where c.id = new.parent_id
    union all
    select c.id, c.parent_id, above.steps_up + 1
    from public.collections c
    join above on c.id = above.parent_id
    where above.steps_up < 10
  )
  select max(above.steps_up), coalesce(bool_or(above.id = new.id), false)
  into parent_depth, makes_a_loop
  from above;

  if makes_a_loop then
    raise exception 'A collection can''t go inside one of its own sub-collections.' using errcode = '23514';
  end if;

  -- How many levels already sit below this collection: 0 for a new one.
  with recursive below as (
    select c.id, 1 as steps_down
    from public.collections c
    where c.parent_id = new.id
    union all
    select c.id, below.steps_down + 1
    from public.collections c
    join below on c.parent_id = below.id
    where below.steps_down < 10
  )
  select coalesce(max(below.steps_down), 0)
  into levels_below
  from below;

  if parent_depth + 1 + levels_below > max_depth then
    raise exception 'Collections only nest three deep, like Europe Trip > France > Paris.' using errcode = '23514';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security: only the collection's owner sees or changes its
-- exclusions. The new columns on collections use the existing collection
-- policies: anyone who can see a collection sees its rules, and only the
-- owner can change them.
-- ---------------------------------------------------------------------------

alter table public.collection_exclusions enable row level security;

create policy "collection_exclusions: on your own collections" on public.collection_exclusions
  for select to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_exclusions.collection_id and c.owner_id = (select auth.uid())
  ));
create policy "collection_exclusions: add to your own" on public.collection_exclusions
  for insert to authenticated
  with check (exists (
    select 1 from public.collections c
    where c.id = collection_exclusions.collection_id and c.owner_id = (select auth.uid())
  ));
create policy "collection_exclusions: remove from your own" on public.collection_exclusions
  for delete to authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = collection_exclusions.collection_id and c.owner_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Grants. The table-level grants on collections already cover its new columns.
-- ---------------------------------------------------------------------------

revoke all on public.collection_exclusions from anon, authenticated;

grant select, insert, delete on public.collection_exclusions to authenticated;

grant all on public.collection_exclusions to service_role;
