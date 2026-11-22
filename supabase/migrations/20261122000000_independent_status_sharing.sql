-- Replaces the single "how much to share" level (hidden/country/city/full)
-- with three independent choices per audience: show country, show city, show
-- dates. Dates only have an effect when country is also shown -- a bare date
-- with no place attached isn't useful on its own. See docs/data-layer.md
-- ("Status sharing").
--
-- Once this has been pushed, change the schema with a new migration. Never
-- edit this file after that.

-- settings: the default level for new/ongoing status updates.
alter table public.settings
  add column default_share_close_friends_country boolean,
  add column default_share_close_friends_city boolean,
  add column default_share_close_friends_dates boolean,
  add column default_share_everyone_country boolean,
  add column default_share_everyone_city boolean,
  add column default_share_everyone_dates boolean;

update public.settings set
  default_share_close_friends_country = default_share_close_friends in ('country', 'city', 'full'),
  default_share_close_friends_city = default_share_close_friends in ('city', 'full'),
  default_share_close_friends_dates = default_share_close_friends = 'full',
  default_share_everyone_country = default_share_everyone in ('country', 'city', 'full'),
  default_share_everyone_city = default_share_everyone in ('city', 'full'),
  default_share_everyone_dates = default_share_everyone = 'full';

alter table public.settings
  alter column default_share_close_friends_country set not null,
  alter column default_share_close_friends_city set not null,
  alter column default_share_close_friends_dates set not null,
  alter column default_share_everyone_country set not null,
  alter column default_share_everyone_city set not null,
  alter column default_share_everyone_dates set not null,
  alter column default_share_close_friends_country set default true,
  alter column default_share_close_friends_city set default true,
  alter column default_share_close_friends_dates set default true,
  alter column default_share_everyone_country set default true,
  alter column default_share_everyone_city set default false,
  alter column default_share_everyone_dates set default false,
  drop column default_share_close_friends,
  drop column default_share_everyone;

-- profile_locations: the current status's own override, same split.
alter table public.profile_locations
  add column share_close_friends_country boolean,
  add column share_close_friends_city boolean,
  add column share_close_friends_dates boolean,
  add column share_everyone_country boolean,
  add column share_everyone_city boolean,
  add column share_everyone_dates boolean;

update public.profile_locations set
  share_close_friends_country = share_close_friends in ('country', 'city', 'full'),
  share_close_friends_city = share_close_friends in ('city', 'full'),
  share_close_friends_dates = share_close_friends = 'full',
  share_everyone_country = share_everyone in ('country', 'city', 'full'),
  share_everyone_city = share_everyone in ('city', 'full'),
  share_everyone_dates = share_everyone = 'full';

alter table public.profile_locations
  alter column share_close_friends_country set not null,
  alter column share_close_friends_city set not null,
  alter column share_close_friends_dates set not null,
  alter column share_everyone_country set not null,
  alter column share_everyone_city set not null,
  alter column share_everyone_dates set not null,
  alter column share_close_friends_country set default true,
  alter column share_close_friends_city set default true,
  alter column share_close_friends_dates set default true,
  alter column share_everyone_country set default true,
  alter column share_everyone_city set default false,
  alter column share_everyone_dates set default false,
  drop column share_close_friends,
  drop column share_everyone;

-- The trimming rule: three independent flags instead of one level.
drop function private.status_json(public.profile_locations, text);

create function private.status_json(
  loc public.profile_locations, show_country boolean, show_city boolean, show_dates boolean
)
returns jsonb
language sql stable
set search_path = ''
as $$
  select case
    when not show_country and not show_city and not show_dates then null
    when loc.status_kind = 'home' then jsonb_build_object('kind', 'home')
    else jsonb_strip_nulls(jsonb_build_object(
      'kind', loc.status_kind,
      'country', case when show_country then c.country end,
      'city', case when show_city then c.name end,
      'until', case when show_dates and show_country and loc.status_kind = 'traveling' then to_char(loc.status_until, 'YYYY-MM-DD') end,
      'month', case when show_dates and show_country and loc.status_kind = 'planning' then to_char(loc.status_month, 'YYYY-MM') end
    ))
  end
  from (select 1) as one
  left join public.cities c on c.id = loc.status_city_id;
$$;

-- Same signature as before (owner uuid) -- only passes three flags through
-- to status_json instead of one level.
create or replace function private.visible_status(owner uuid)
returns jsonb
language sql stable
security definer set search_path = ''
as $$
  select case
    when owner = (select auth.uid()) then private.status_json(l, true, true, true)
    when private.is_close_friend(owner, (select auth.uid())) then
      private.status_json(l, l.share_close_friends_country, l.share_close_friends_city, l.share_close_friends_dates)
    else
      private.status_json(l, l.share_everyone_country, l.share_everyone_city, l.share_everyone_dates)
  end
  from public.profile_locations l
  where l.user_id = owner
    and not private.has_blocked(owner, (select auth.uid()));
$$;

grant execute on function private.status_json(public.profile_locations, boolean, boolean, boolean)
  to authenticated, service_role;

-- Grants: re-issue with the new column names in place of the old ones.
grant update (home_city_id, status_kind, status_city_id, status_until, status_month,
  share_close_friends_country, share_close_friends_city, share_close_friends_dates,
  share_everyone_country, share_everyone_city, share_everyone_dates)
  on public.profile_locations to authenticated;

grant update (default_share_close_friends_country, default_share_close_friends_city, default_share_close_friends_dates,
  default_share_everyone_country, default_share_everyone_city, default_share_everyone_dates,
  map_visibility, home_visibility, follow_lists_visibility, new_collections_private, show_in_suggestions,
  findable_by_contact, notifications_paused, notify_new_follower, notify_likes_comments,
  notify_close_friend_status, notify_trip_overlap)
  on public.settings to authenticated;
