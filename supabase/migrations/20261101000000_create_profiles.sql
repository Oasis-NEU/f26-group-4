-- One row per account: the public parts of a user's profile (src/types/profile.ts).
-- Supabase Auth keeps the email and password in auth.users. Everything else lives here.
-- To apply it, paste this file into the Supabase dashboard's SQL Editor and run it.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  username text not null unique,
  profile_picture text,
  bio text,
  home_country text,     -- 2-letter code, e.g. 'US'
  current_country text,  -- 2-letter code, e.g. 'FR'
  interests text[] not null default '{}',
  created_at timestamptz not null default now()
);
-- Profile.friendIds and Profile.postIds become their own tables (friendships, reviews) later.

alter table public.profiles enable row level security;

-- Anyone signed in can see profiles. The feed, reviews, and suggested friends need this.
create policy "Signed-in users can see profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- People can only edit their own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- When someone signs up, create their profile from the name and username the app sends
-- in signUp's options.data (src/hooks/use-user.tsx).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
