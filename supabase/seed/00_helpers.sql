-- Helpers for the seed files. Rules for adding demo data: docs/backend-plan.md, "Demo data".
-- They live in a `seed` schema, which the API doesn't expose.

create schema if not exists seed;

-- A person's id from their username. A typo stops the run instead of quietly
-- matching nobody.
create or replace function seed.user(who text)
returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select p.id into v_id from public.profiles p where p.username = who;
  if v_id is null then
    raise exception 'seed.user: no account named %. Is it in accounts.json?', who;
  end if;
  return v_id;
end;
$$;

-- The same id for the same readable key, every time: seed.id('place', 'trattoria-da-nino').
-- Other files can point at a row by its key, and a reset rebuilds the same ids.
create or replace function seed.id(kind text, key text)
returns uuid
language sql immutable
set search_path = ''
as $$
  select md5(kind || ':' || key)::uuid;
$$;

-- A starter interest's id from its slug ('hiking'). A typo stops the run.
create or replace function seed.interest(wanted text)
returns uuid
language plpgsql stable
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select i.id into v_id from public.interests i where i.slug = wanted;
  if v_id is null then
    raise exception 'seed.interest: no interest with slug %', wanted;
  end if;
  return v_id;
end;
$$;
