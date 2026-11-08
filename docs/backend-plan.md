# Backend plan (Supabase)

What we want the Supabase backend to do: the tables, who can see what, the functions the app calls, file storage, accounts, and the order to build it in. It's written from what the app does today (the services in `src/services/`, the types in `src/types/`, and the screens), so every piece of mock data has somewhere to go.

**Status:** a draft for the team to review. Nothing is built yet: there's no Supabase client and no migrations. [data-layer.md](data-layer.md) Phase 0 (React Query) isn't done either. The two can happen at the same time.

**This replaces** [supabase-schema.sql](supabase-schema.sql) and the "The schema" part of [data-layer.md, Phase 2](data-layer.md#phase-2-supabase). Those were written before follows, settings, privacy, interests and profile cities existed ([what changed](#what-changed-from-the-old-schema)). Everything else in data-layer.md still applies: services and hooks, query keys, and how a service moves from mock data to Supabase.

## In short

- **21 Postgres tables** for people, places, posts, saving, and following.
- **The database enforces privacy, not the screens.** The app's key ships inside the app, so anyone can call our API directly. Anything a screen hides (someone's exact travel status, their close friends, a private collection) has to be hidden by the database too.
- **Where you live and where you are is private.** It's in a table only you can read. Everyone else gets a trimmed copy through `visible_home` and `visible_status`, which apply your sharing settings.
- **Counts and ratings are calculated, not stored**, so they're never out of date. Badges, the profile checklist and goal progress stay in the app.
- **One public storage bucket**, `media`, with a folder per user. Photos are resized on the phone before upload.
- **Email and password sign-in.** One Edge Function, `delete-account`, for Settings → Account → Delete account.
- **Demo data is real rows** in the real database: one seed file per system, rebuilt with one command before demo day.
- **Later:** push notifications, a live inbox, auto-sorting saves, AI summaries, trip overlap.

## What the app needs

| Feature | Backend |
| --- | --- |
| Create account, log in, log out | Supabase Auth. A trigger creates your profile, settings and location rows. `is_username_available()` |
| Feed, Map, Place details, City page | `places`, `reviews`, `review_media`. `average_rating`, `friends_rating`, `review_count`. `search_places()` |
| Upload | `create_review()`. Photos in the `media` bucket. `place_types` and `suited_for_tags` fill the pickers |
| Saved, Collection, save sheet | `saves`, `collections`, `collection_places` |
| Explore | `cities` and the `city_stats` view |
| Profile, yours and other people's | `profiles` with `follower_count`, `following_count`, `place_count`, `visible_status`, `visible_home`. `profile_interests`, `travel_goals` |
| Follow button, 📥 inbox | `follow()`, `follow_requests`, `accept_follow_request()` |
| Suggested friends | `suggested_friends()` |
| Edit profile | `profiles`, `profile_locations`, `profile_interests`, `interests`, `add_interest()`, `cities` |
| Settings: privacy, close friends, blocked, notifications | `settings`, `close_friends`, `blocks`, `profiles.account_type` |
| Settings: your travel | `travel_goals` |
| Settings: account | Auth (email, password), the `delete-account` Edge Function |
| Likes and comments on Feed cards | `review_likes`, `review_comments` (see [open decision 4](#open-decisions)) |
| Notification switches and the 🔔 bell | Saved in `settings` and `follows` now. Sending notifications comes [later](#later). |

## Principles

1. **Privacy lives in the database.** Every table has row level security (RLS) turned on, with its policies and grants in the same migration ([writing migrations](#writing-migrations)). With RLS on and no policies, the app can't use a table at all. With RLS off, anyone signed in can read and change every row.
2. **RLS decides what you're allowed to see, not what a screen asked for.** Other people's public collections are readable, so "my collections" has to ask for `owner_id = me` itself. Services get "me" from the session, so callers still don't pass it ([data-layer rule 9](data-layer.md#the-rules)).
3. **Calculated, not stored.** Ratings, counts, interest popularity and city stats are worked out when they're asked for. Nothing has to be kept in sync.
4. **The database keeps its own rules** with triggers ([the list](#rules-the-database-keeps)). The mock services copy the same rules ([data-layer rule 10](data-layer.md#the-rules)).
5. **"Friends" means people you follow.** The old plan had two-way friendships. The app has follows now, so `friends_rating` is the average from people you follow.
6. **Services hide the database.** Columns are `snake_case`. Services turn rows into the app's types (`camelCase`) and storage paths into image URLs, so screens don't change.
7. **Stay inside the free plan**: small photos, no video at first, and someone uses the project at least weekly ([see below](#before-we-start)).

## Tables

Every table has an `id uuid` made by the database unless it says otherwise, and a `created_at` timestamp (not listed below). `→` is a foreign key. Deleting a user deletes everything that's theirs, unless it says otherwise.

### People

**`profiles`**: one per user, holding what anyone signed in may see. The sign-up trigger creates it.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid → `auth.users` | the same id as the Auth user |
| `username` | text, unique | lowercase letters, numbers, `.` and `_`; 3 to 30 characters |
| `name` | text | |
| `bio` | text, optional | up to 160 characters |
| `avatar_path` | text, optional | in the `media` bucket. Missing means show initials. |
| `avatar_hue` | 0 to 359, optional | the initials' background color |
| `cover_mode` | `auto`, `custom` or `none` | default `auto` |
| `cover_path` | text, optional | used when `cover_mode` is `custom` |
| `dream_trip_city_id` | → `cities`, optional | |
| `account_type` | `public` or `friends_only` | default `public`. It's here and not in `settings` because other people need it to show **Follow** or **Request**. |

**`profile_locations`**: where you live and where you are. **Only you can read your row.** Others get it through [`visible_home` and `visible_status`](#computed-fields). The sign-up trigger creates it.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | → `profiles`, the primary key | |
| `home_city_id` | → `cities`, optional | "Lives in". Empty until you set it, so `Profile.homeCityId` becomes optional. |
| `status_kind` | `home`, `traveling` or `planning` | default `home` |
| `status_city_id` | → `cities` | required unless `status_kind` is `home` |
| `status_until` | date, optional | traveling: "until Nov 20" |
| `status_month` | date, optional | planning: the first day of the month |
| `share_close_friends` | `hidden`, `country`, `city` or `full` | default `full` |
| `share_everyone` | same as above | default `country` |
| `status_updated_at` | timestamp | for "a close friend updated their status" notifications later |

**`settings`**: your private settings. Only you can read or change your row. The sign-up trigger creates it.

| Column | Values | Default |
| --- | --- | --- |
| `user_id` | → `profiles`, the primary key | |
| `default_share_close_friends`, `default_share_everyone` | as on `profile_locations`; where the sharing pills start when you set a new status | `full`, `country` |
| `map_visibility` | `everyone`, `close_friends` or `only_me` | `everyone` |
| `home_visibility` | `city`, `country` or `hidden` | `city` |
| `follow_lists_visibility` | `everyone` or `only_me` | `everyone` |
| `new_collections_private` | true or false | false |
| `show_in_suggestions` | true or false | true |
| `findable_by_contact` | true or false; saved now, finding people by email or phone comes later | false |
| `notifications_paused`, `notify_new_follower`, `notify_likes_comments`, `notify_close_friend_status`, `notify_trip_overlap` | true or false | false, true, true, true, false |

The app's `Settings` type also has `accountType` (from `profiles`), `closeFriendIds` (from `close_friends`) and `blockedIds` (from `blocks`). `getSettings()` puts the pieces together.

**`cities`**: the shared list behind "Lives in", "Dream trip", travel status and, if we [decide to](#open-decisions), places. Anyone signed in can read it.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text, e.g. `boston-us` | readable ids, the same as `profile-cities.ts` uses now |
| `name` | text | `Boston` |
| `country` | text | `United States` |
| `country_code` | 2 letters | `US`, for the flag |
| `latitude`, `longitude` | optional | to center the map on the city |
| `cover_path` | optional | the Explore tile. Falls back to the best-rated place's cover. |
| `created_by` | → `profiles`, optional | empty for the seeded list. Kept (set to empty) if that user is deleted. |

Name and country code together are unique, so there's one Boston in the US and one in the UK.

**`interests`** and **`profile_interests`**:

| Table | Columns |
| --- | --- |
| `interests` | `id`, `name`, `slug` (unique, e.g. `rooftop-bars`), `is_starter`, `created_by` (→ `profiles`, kept if that user is deleted) |
| `profile_interests` | `profile_id`, `interest_id`. The primary key is both. |

The app's `Interest.userCount` is the `user_count` field, counted when asked for.

**`travel_goals`**: `user_id`, `year`, `metric` (`countries`, `cities` or `places`) and `target` (more than 0). The primary key is `user_id` and `year`, so there's one goal per year. Progress is still worked out in the app from your reviews.

### Places and posts

**`places`**:

| Column | Type | Notes |
| --- | --- | --- |
| `name` | text | |
| `place_type` | → `place_types` | |
| `suited_for` | list of tags from `suited_for_tags` | a new review adds its tags |
| `address` | text | |
| `city_id` | → `cities` | in place of typed `city` and `country` ([open decision 1](#open-decisions)) |
| `latitude`, `longitude` | numbers, required | without them the place can't go on the map |
| `website` | optional | |
| `cover_path` | optional | falls back to the newest photo from its reviews |
| `description` | optional | |
| `ai_summary` | optional | written by an Edge Function later. People can't set it. |
| `is_verified` | true or false, default false | set by us in the dashboard. People can't set it. |
| `created_by` | → `profiles` | the signed-in user. Kept (set to empty) if that user is deleted. |

**`place_types`** and **`suited_for_tags`**: the fixed lists behind the filters and Upload's pickers. The app can read them but not change them; migrations change them.

| Table | Columns |
| --- | --- |
| `place_types` | `slug` (e.g. `cafe`, the primary key), `label` (`Cafe`), `emoji`, `category` (`Food`, `Outdoors`, `Culture` or `Other`, for the Badges tab's traveler type), `sort_order` |
| `suited_for_tags` | `slug` (e.g. `remote-work`, the primary key), `label` (`Remote work`), `sort_order` |

This fixes a mismatch that exists today: Upload offers `Cafe`, `Sport` and `Families`, while the mock places use `cafe`, `garden` and `family`. They replace `PLACE_TYPES` and `SUITED_FOR` in `places.ts`, Upload's two hard-coded lists, and the category list in `profile-badges.tsx`.

**`reviews`**: one person's post about one place.

| Column | Type | Notes |
| --- | --- | --- |
| `place_id` | → `places` | |
| `author_id` | → `profiles` | the signed-in user |
| `rating` | 1 to 5 | |
| `body` | text, optional | up to 2,000 characters |
| `suited_for` | list of tags | |
| `updated_at` | timestamp | |

One review per person per place ([open decision 5](#open-decisions)). The `Review` type's `placeType`, `address`, `city`, `country` and `profileName` aren't stored on the review; the service fills them in from the place and the author. Its `isVerified` doesn't mean anything yet, so drop it from the type unless the team gives it a meaning.

| Table | Columns |
| --- | --- |
| `review_media` | `review_id`, `kind` (`photo`, or `video` later), `path` (in `media`), `caption`, `position` |
| `review_likes` | `review_id`, `user_id`. The primary key is both. |
| `review_comments` | `review_id`, `author_id`, `body` (1 to 1,000 characters) |

### Saving

| Table | Columns |
| --- | --- |
| `saves` | `user_id`, `place_id`. The primary key is both. This is the bookmark. |
| `collections` | `owner_id`, `parent_id` (→ `collections`, one level deep), `name`, `emoji` (optional; `collection-card.tsx` has a TODO for it), `cover_path` (optional; falls back to the first place's image), `is_private`, `updated_at` |
| `collection_places` | `collection_id`, `place_id`, `added_at`. The primary key is the first two. |

"All saved" is the `saves` table. Loose saves are saves that aren't in any of your collections. A collection's `country` is worked out from its places.

### Following

| Table | Columns |
| --- | --- |
| `follows` | `follower_id`, `following_id`, `notify_posts` and `notify_status` (the 🔔 bell, both off to start). The primary key is the first two. You can't follow yourself. |
| `follow_requests` | `from_id`, `to_id`. The primary key is both. Only used for friends-only accounts. |
| `close_friends` | `owner_id`, `friend_id`. The primary key is both. Only the owner can see it, and the friend has to follow the owner. |
| `blocks` | `blocker_id`, `blocked_id`. The primary key is both. Only the blocker can see it. |

### Tables for later

- **Push notifications** add `push_tokens` (`user_id`, `token`, `platform`) and `notifications`, an activity list (`user_id`, `kind`, `actor_id`, `review_id`, `read_at`).
- **Auto-sort** adds `is_auto`, `match_country`, `match_city_id` and `match_place_type` to `collections`, and `auto_sort_saves` to `settings`. First answer the open questions in the `collections.ts` note.

## Who can see what

Every rule is for signed-in people. Signed out, you can't read anything except `is_username_available()`.

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | anyone, except people who blocked you | your own row. The trigger creates it. |
| `profile_locations`, `settings` | only you | only you |
| `cities` | anyone | anyone can add a city if we take [open decision 1](#open-decisions). Nobody edits. |
| `interests` | anyone | through `add_interest()` |
| `profile_interests`, `travel_goals` | anyone | your own |
| `places` | anyone | anyone can add one, as long as `is_verified` is false and `ai_summary` is empty. No edits in v1. |
| `place_types`, `suited_for_tags` | anyone | migrations only |
| `reviews`, `review_media` | anyone, except posts by people who blocked you | the author |
| `review_likes` | anyone who can see the review | your own likes |
| `review_comments` | anyone who can see the review, except comments by people who blocked you | add your own. Delete your own, or any on your post. |
| `saves` | only you | only you |
| `collections`, `collection_places` | you. Others see the ones that aren't private (a sub-collection is private if its parent is), except people the owner blocked. | the owner |
| `follows` | the two people. Others too, if either person's follow lists are public. | follow a public account as yourself. Only the follower can change the bell. Either person can end it. |
| `follow_requests` | the two people | send one as yourself to a friends-only account. Either person can delete it, which is cancel or decline. |
| `close_friends`, `blocks` | only the owner | only the owner |

Follower and following counts come from functions, so they still show when someone hides their lists.

## Functions the app calls

### Computed fields

Functions that act like extra columns. Ask for them by name, e.g. `.select('*, average_rating, review_count')`.

| Table | Field | What it is |
| --- | --- | --- |
| `places` | `average_rating`, `review_count` | |
| `places` | `friends_rating` | the average from people you follow, not counting your own review |
| `profiles` | `follower_count`, `following_count`, `place_count` | |
| `profiles` | `visible_status` | their status, trimmed for you: `{ kind, country, city?, until?, month? }`, or nothing if it's hidden from you. Yours comes back in full. |
| `profiles` | `visible_home` | their home city at the level they allow: city and country, country only, or nothing |
| `profiles` | `suggestion_reason` | "Also in Lisbon" or "3 mutuals", for suggested friends and the inbox |
| `reviews` | `like_count`, `comment_count` | |
| `interests` | `user_count` | how many profiles picked it |

`visible_status` is the most important one. Today `getVisibleStatus` trims the status on the phone, after the phone has already downloaded all of it. With Supabase the trimming happens before anything leaves the database. The function the app selects has no special rights; it asks a helper in the `private` schema, which can read the private row ([why](#functions-that-skip-rls)):

```sql
-- Select it like a column: .select('*, visible_status')
create function public.visible_status(profile public.profiles)
returns jsonb
language sql stable
set search_path = ''
as $$
  select private.visible_status(profile.id);
$$;

-- Reads the owner's private row, so it skips RLS. The API can't call it directly.
create function private.visible_status(owner_id uuid)
returns jsonb
language sql stable
security definer set search_path = ''
as $$
  select case
    when owner_id = (select auth.uid()) then private.status_json(l, 'full')
    when private.is_close_friend(owner_id, (select auth.uid())) then private.status_json(l, l.share_close_friends)
    else private.status_json(l, l.share_everyone)
  end
  from public.profile_locations l
  where l.user_id = owner_id
    and not private.has_blocked(owner_id, (select auth.uid()));
$$;
```

`private.status_json(row, level)` does what `trimStatusForLevel` does in `users.ts`. Keep the app's copy for Edit profile's "Close friends see: …" previews.

### RPCs

Called with `supabase.rpc('name', { ...arguments })`.

| Function | Used by | What it does |
| --- | --- | --- |
| `is_username_available(username)` | Create account, Edit profile | Works signed out. Your own current username counts as available. |
| `search_places(query, place_types, suited_for)` | Feed, Map, Upload suggestions | Matches the place name or city name. Returns places, so `.select('*, average_rating')` still works on the result. Safer than building `.or(...)` filters out of typed text. |
| `create_review(...)` | Upload | Adds the place if it's new, then the review and its photos' rows, all together. If any part fails, nothing is saved. |
| `follow(user_id)` | Follow button | Follows a public account, or sends a request to a friends-only one. Returns `following` or `requested`. |
| `accept_follow_request(from_id)` | 📥 inbox | Creates the follow and deletes the request. |
| `suggested_friends(max_results)` | Profile | People you don't follow or block, who allow suggestions. Shared interests and the same visible travel country come first. |
| `add_interest(name)` | Interests panel | Returns the existing interest if one has the same slug. |
| `popular_interests(max_results)` | Interests panel | The starter list, plus interests at least 5 people picked. |
| `search_profiles(query)` | People search, when it has a page ([09-explore.md](pages/09-explore.md#still-to-decide)) | Matches username or name. |

### Views

| View | Used by | What it is |
| --- | --- | --- |
| `city_stats` | Explore | One row per city that has places: place count, review count, average rating, place types, cover image and popularity. It replaces the grouping in `cities.ts`. |

A view skips RLS unless it's created `with (security_invoker = true)`, and the Security Advisor reports it as an error. Every view we make needs that.

### Functions that skip RLS

Some functions have to read rows the caller can't: `visible_status` reads the owner's location and close friends, and `suggested_friends()` reads other people's `show_in_suggestions`. Those parts are `security definer` functions, which run with their creator's rights and skip RLS. Each one:

- lives in the `private` schema, which the API doesn't expose. The app reaches it only through a function in `public`, like the pair above.
- sets `search_path = ''`.
- works out who's asking from `auth.uid()` and applies the rules itself. A `public` function could pass it any id.

Functions in `public`, the ones the app calls, stay `security invoker` (the default), so RLS still applies inside them. The Security Advisor warns about `security definer` functions the API can reach.

Policies that look at other rows of the same table (a collection checking its parent) also go through a private helper. Otherwise Postgres stops with "infinite recursion detected in policy".

## Rules the database keeps

Triggers that hold whatever the app sends:

1. Signing up creates your `profiles`, `settings` and `profile_locations` rows, using the `username` and `name` passed to `signUp`. If they're missing, which happens when someone adds a user in the dashboard, it makes a username from the email instead of failing, because a failing trigger stops the user from being created at all.
2. Putting a place in a collection saves it. Unsaving a place takes it out of all your collections. (Both are in the old schema already.)
3. Collections only nest one level deep.
4. A new collection is private if your `new_collections_private` setting is on, unless the app says otherwise.
5. Blocking someone ends follows, follow requests and close-friend entries between the two of you, both ways.
6. When someone stops following you, they come off your close friends.
7. Turning friends-only off accepts every waiting request. (`acceptAllFollowRequests` does this in the app today.)
8. A new review adds its suited-for tags to its place.
9. `updated_at` columns update themselves.

## Storage

- One **public** bucket named `media`, with a folder per user:

  ```
  <user id>/avatar/<random id>.jpg
  <user id>/cover/<random id>.jpg
  <user id>/reviews/<random id>.jpg
  ```

- The database stores the path, never the full URL. `getMediaUrl(path)` turns a path into a URL. Demo photos live in `media/seed/` ([demo data](#demo-data)).
- Policies: you can upload, replace and delete files only inside your own folder. The upload policy is in [data-layer.md](data-layer.md#media); add matching `update` and `delete` policies.
- Bucket settings: at most 5 MB per file (the free plan allows up to 50 MB), and only `image/jpeg`, `image/png` and `image/webp`.
- **Resize before uploading.** Since SDK 54 the image picker hands back the original file, which can be a large HEIC. Shrink it to 1280 px wide (if it's wider) and save it as a JPEG with `expo-image-manipulator`, a new package (`npx expo install expo-image-manipulator`):

  ```ts
  const image = await ImageManipulator.manipulate(uri).resize({ width: 1280, height: null }).renderAsync();
  const { uri: smallUri } = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  ```

  Then upload `smallUri`'s bytes the way data-layer.md's [Media](data-layer.md#media) section shows. Supabase only resizes images on paid plans, so this is up to the phone.
- **Deleting files** only works through the Storage API. Since March 2026 Supabase blocks deleting them with SQL, so a database rule can't clean them up. When a review, photo, avatar or cover goes away, the service also calls `supabase.storage.from('media').remove(paths)`. A user who still owns files can't be deleted, so `delete-account` empties their folder first.
- Public means anyone with a photo's link can open it, even signed out. Paths have random ids, so they can't be guessed. If friends-only accounts ever hide posts, switch to a private bucket with signed URLs.

## Accounts

- **Sign in with email and password** ([open decision 8](#open-decisions)).
- **Create account:** `supabase.auth.signUp({ email, password, options: { data: { username, name } } })`. Check `is_username_available` while they type, so "taken" shows before they submit. If two people grab the same username at once, the unique index stops the second sign-up with an error, which the screen should show.
- **Confirm email:** turn it off in the shared project so test accounts work straight away. Turn it on before a real release.
- **Emails:** Supabase's built-in sender only sends 2 emails an hour, and only to people on the project's team. That's enough for testing. Before real users, set up a custom SMTP provider in the Auth settings, or confirmation, change-email and password-reset emails won't arrive.
- **Settings → Account:**
  - Email: `supabase.auth.updateUser({ email })`. Supabase emails a confirmation link.
  - Password: `supabase.auth.updateUser({ password })`. "Forgot password" needs a link that opens the app; that comes later.
  - Phone and birthday: not planned ([open decision 11](#open-decisions)).
  - Delete account: the [`delete-account`](#edge-functions) Edge Function, then sign out.
- **Demo users** come from the [demo data](#demo-data) reset, not from signing up by hand, so they exist before the app's sign-up is connected. The demo buttons on Login sign in with the shared demo password. They show when `EXPO_PUBLIC_DEMO_LOGINS` is on, not only in development builds, so they still work in the build you demo from ([demo day](#demo-day)).

## Edge Functions

Small server functions for the things the app isn't allowed to do itself.

| Function | When | What it does |
| --- | --- | --- |
| `delete-account` | v1 | Checks who's calling, deletes their files in `media`, then deletes their Auth user, which deletes all their rows. The App Store and Google Play both require apps that let you create an account to let you delete it from inside the app. |
| `send-push` | later | Triggers add a `notifications` row when someone follows you, asks to follow you, likes or comments on your post, or a close friend changes their status. A database webhook sends each new row to this function, which checks your notification settings and the 🔔 bell, then sends the push through Expo's push service. This is Supabase's own [push notification example](https://supabase.com/docs/guides/functions/examples/push-notifications). |
| `summarize-place` | later | Writes `places.ai_summary` from the place's reviews. |
| `trip-overlap` | later | Runs daily and finds people you follow who'll be in the same city as you. |

Edge Functions can use the project's secret key, which skips RLS. They read it from their environment (`SUPABASE_SECRET_KEYS`), or through Supabase's `@supabase/server` helper, which also checks who's calling. It never goes in the app or in git.

## How each service changes

Services keep their names, so screens don't change. Functions lose the signed-in user's id ([data-layer rule 9](data-layer.md#the-rules)). When a function changes, update the [Contracts tables in data-layer.md](data-layer.md#contracts) in the same PR.

| File | Today | With Supabase |
| --- | --- | --- |
| `places.ts` | `getPlaces(filters)` | Same name. `search_places()`, with ratings, the city and the newest review. |
| | `getPlace(id)` | Same name. With its reviews, their authors and photos. |
| | `toggleBookmark(placeId)` | Removed. `savePlace` / `unsavePlace` in `collections.ts`. |
| | `PLACE_TYPES`, `SUITED_FOR` | `getPlaceTypes()`, `getSuitedForTags()` from the two lists. Cache them for good; they only change with a migration. |
| `cities.ts` | `getCities(filters)` | The `city_stats` view. |
| | `getCity(name)`, `getCityPlaces(name)` | Take a city id, so the route becomes `/city/[id]`. |
| `profile-cities.ts` | `getProfileCity(id)`, `searchProfileCities(query)` | The `cities` table. Merge into `cities.ts`. |
| `collections.ts` | `getCollections()` | Ask for `owner_id = me`, since other people's public collections are readable too. |
| | `getCollectionsForProfile(ownerId, viewerId)` | `getCollectionsForProfile(ownerId)`. RLS leaves out the private ones. |
| | `getCollection(id)` | Same. `ALL_SAVED_ID` is still built from `saves`. |
| | `getAllSavedPlaces()`, `getSavedPlaces()` | Your `saves`. The loose ones are saves minus the places in your collections. |
| | not built yet | `getSavedPlaceIds`, `savePlace`, `unsavePlace`, and the rest of the [collections contract](data-layer.md#services). |
| `reviews.ts` | `getReviewsByAuthor(authorId)` | Same. With the place and photos. |
| `posts.ts` (from the `upload-screen` branch) | `createPost(fields)` | Same name. Upload the photos, then call `create_review()`; if that fails, delete the photos. It takes over data-layer's planned `createReview` and `createPlace`. |
| | `validatePost(fields)` | Stays in the app. The database checks the rating and lengths again. |
| `users.ts` | `getProfile(id)` | Same. With the counts, `visible_status`, `visible_home`, interests and goals. |
| | `isUsernameAvailable(username, excludingUserId)` | `isUsernameAvailable(username)`. |
| | `trimStatusForLevel(status, level)` | Stays in the app, for Edit profile's previews only. |
| | `getVisibleStatus(profile, viewerId, closeFriendIds)` | Removed. The database trims it (`visible_status`). |
| | `getSuggestedFriends(userId)`, `getSuggestionReason(myId, other)` | `getSuggestedFriends()`, with the reason included. Moves to `follows.ts` (data-layer calls it `friends.ts`). |
| | `getFriendUsernames(userId)` | `getFollowingIds()`. The Map should compare ids, since usernames can change. |
| | `updateProfile(id, changes)` | Split by panel: `updateProfile(changes)`, `updateStatus(status)`, `setInterests(ids)`, `setTravelGoal(goal)`. |
| `follows.ts` | `getFollowerIds(userId)`, `getFollowingIds(userId)` | Same. Empty when that person hides their lists. |
| | `isFollowing(followerId, followingId)` | `isFollowing(userId)`. |
| | `followUser(followerId, followingId)` | `follow(userId)`, which returns `following` or `requested`. |
| | `unfollowUser(followerId, followingId)` | `unfollow(userId)`. Also cancels a waiting request. |
| | `setNotifyPrefs(followerId, followingId, prefs)` | `setNotifyPrefs(userId, prefs)`. |
| | `getFollowRequests(userId)` | `getFollowRequests()`, with each person's profile and reason. |
| | `acceptFollowRequest(userId, fromId)`, `declineFollowRequest(userId, fromId)` | `acceptFollowRequest(fromId)`, `declineFollowRequest(fromId)`. |
| | `acceptAllFollowRequests(userId)` | Removed. The database does it when friends-only is turned off. |
| `settings.ts` | `getSettings(userId)`, `updateSettings(userId, changes)` | `getSettings()`, `updateSettings(changes)`. `accountType` saves to `profiles`, the rest to `settings`. |
| | `addCloseFriend`, `removeCloseFriend`, `blockUser`, `unblockUser` | Drop the first argument, the signed-in user. |
| `interests.ts` | `getInterestsByIds(ids)`, `searchInterests(query)` | Same. |
| | `getPopularInterests(limit)` | `popular_interests()`. |
| | `suggestInterestsFromPosts(userId)` | `suggestInterestsFromPosts()`. The place-type-to-interest list can stay in the app. |
| | `addInterest(name, userId)` | `addInterest(name)`, through `add_interest()`. |
| `media.ts` (new) | | `uploadMedia(localUri, folder)` returns the path. `getMediaUrl(path)`, `deleteMedia(paths)`. |
| `use-session.tsx` (new) | | As planned in data-layer, plus `deleteAccount()`, `changeEmail()` and `changePassword()`. |

## Demo data

Demo data is real rows in the real database, so on demo day everything works for real: people can sign up, post, save and follow on top of it. Today each developer keeps mock data in their own service file. This keeps that habit (each system has its own seed file, owned by whoever owns the service) and adds shared rules, so files can point at each other's rows and the whole set rebuilds with one command.

### How it's organized

```
supabase/
  migrations/          the schema, plus the fixed lists (see below)
  seed/
    accounts.json      every demo and background account
    photos/            demo photos and avatars, already resized
    00_helpers.sql     seed.user() and seed.id()
    10_people.sql      profiles, locations, settings, interests, goals
    20_places.sql      places, reviews, review photos
    30_saved.sql       saves, collections
    40_following.sql   follows, requests, close friends, blocks
    50_reactions.sql   likes, comments
    reset.mjs          the one command that rebuilds it all
```

The fixed lists go in migrations, not seed files, because the app needs them in every project and a reset should never touch them: the 14 cities from `profile-cities.ts` (they cover every mock place's city), the place types and suited-for tags (Upload's lists and the mock data's, merged and lowercased), and the 12 starter interests.

### Rules for adding data

1. **One file per system.** Add rows to your system's file. A new system gets a new file with the next free number.
2. **Files run in number order.** A file can only point at accounts and at rows from lower-numbered files.
3. **No pasted ids.** People are `seed.user('folake')`. Everything else has a readable key: `seed.id('place', 'da-nino')` always gives the same id (it's `md5('place:da-nino')::uuid`), so other files can point at it and a reset rebuilds the same rows. Keys only need to be unique within their kind.
4. **Dates are relative to today:** `now() - interval '3 days'`, `current_date + 5`. The demo looks current whenever it's rebuilt.
5. **Photos by file name.** Put the file in `seed/photos/` and use `seed/<file name>` as its path.
6. **Files never delete.** The reset clears old rows first. A file inserts its rows, updates the ones sign-up already made (profiles, settings, locations), and upserts rows no account owns, such as places (`on conflict (id) do update`), so running it again replaces them.

A typo fails loudly: a wrong username or key breaks the run with a foreign-key error instead of quietly loading half the data.

### Accounts

`accounts.json` lists every account, one line each, e.g. `{ "username": "folake", "name": "Folake", "role": "demo" }`. Emails are `<username>@example.com`, all with one shared password.

- **demo:** Folake, Kenji and Amara, who get the sign-in buttons.
- **background:** the 11 people whose mock reviews have no author today (`dgonzalez`, `s.whitfield`, `priya_n` and 8 more). Every review needs a real author, and one person can only review a place once.

For your own testing, make your own account in the app. Resets don't touch it.

### Resetting

`node supabase/seed/reset.mjs` rebuilds the demo from nothing:

1. For each account in `accounts.json`: delete its files and the account, then create it again. Deleting an account deletes everything it made, so the reset never needs a list of tables, and new tables are covered as long as their rows belong to someone.
2. Upload `seed/photos/` to `media/seed/`, replacing what's there.
3. Run the SQL files in order, all in one transaction.

Accounts that aren't in `accounts.json`, like yours or the audience's, are left alone along with everything they made.

It's a Node script: supabase-js for the accounts and files, and the `postgres` package for the SQL. It needs two secrets, passed in from the terminal and never committed or given an `EXPO_PUBLIC_` name: the secret key, and the database connection string.

### From mock services to seed files

When a service switches to Supabase, its mock data moves into its seed file and the mock array is deleted. Ids change on the way: `u1` becomes `seed.user('folake')`, and `place_001` becomes `seed.id('place', 'mountain-peak-cafe')`. While moving it:

- Keep the demo's story: Folake is friends-only, traveling, with Kenji as a close friend and her collections. Kenji is planning a trip to Rome. Amara is new and has asked to follow Folake.
- Leave out the 12 mock photos with empty URLs and the 2 videos, which point at example.com ([open decision 6](#open-decisions)).
- The 6 mock websites point at example.com too. Use the real ones, or leave them empty so the Website button hides.
- Keep the hand-written AI summaries in `ai_summary`, so Place details looks complete before `summarize-place` exists.
- The mock data has no likes or comments yet. Add some to `50_reactions.sql` so Feed cards don't all show zero.

## Writing migrations

[data-layer.md](data-layer.md#changing-the-schema-later) has the workflow: a new migration for every change, and never edit one that's been pushed. Supabase changed some defaults in 2026, so each migration also needs:

- **RLS and policies** for every new table: `alter table … enable row level security`, then its policies from [Who can see what](#who-can-see-what).
- **Grants** for every new table. New tables aren't open to the API by themselves any more; without a grant, the app gets error `42501`. Grant `select` to `authenticated`, plus `insert`, `update` and `delete` where people can write, and everything to `service_role` for Edge Functions. RLS still decides which rows. `anon`, someone signed out, gets nothing. On `follows`, grant `update` on just `notify_posts` and `notify_status`, so the bell is the only thing that can change.
- **Function rights.** Postgres lets everyone run a new function, signed-out visitors included. The first migration turns that off with `alter default privileges revoke execute on functions from public` (and the same `in schema public … from anon, authenticated`, in case the project grants those too). After that, each function grants `execute` to the roles that use it (`anon` only for `is_username_available`), and those roles get `usage` on the `private` schema.
- **Views** made `with (security_invoker = true)`.

After pushing, regenerate `src/types/database.ts` and run the Security Advisor. The Supabase CLI reached v3 on Nov 2, 2026, and the type command is now `npx supabase gen types --remote > src/types/database.ts`. data-layer.md 2a still shows the v2 form.

## Build order

The schema is easiest with **one person writing migrations** and everyone else reviewing them, since two migrations written at once can clash. Services switch over afterwards, one PR per file, as in [data-layer.md 2c](data-layer.md#2c-move-services-to-supabase-one-pr-per-file-any-order-after-2a), with two limits on the order:

- Everything waits until the session uses Supabase Auth (data-layer 2b). Signed-out people can't read anything, so no service works against Supabase before that. (data-layer.md says "any order after 2a".)
- Then `places.ts` goes first. The seeded places get new ids, so a mock `place_001` can't be saved into a real collection. `collections.ts`, `reviews.ts`, `posts.ts` and `cities.ts` follow it.
- Each switch moves that service's mock data into its seed file ([how](#from-mock-services-to-seed-files)).

### B0. Decide (whole team)

- [ ] Go through the [open decisions](#open-decisions). Change a default here if the team wants something else.
- [ ] Do [before we start](#before-we-start).

### B1. Core (one person, one PR)

- [ ] Supabase CLI set up and linked (data-layer 2a, step 4)
- [ ] Migration: `cities`, `place_types` and `suited_for_tags` with their starting rows, then `profiles`, `profile_locations`, `settings`, `blocks`, the sign-up trigger, the `private` schema, and the function-rights default from [Writing migrations](#writing-migrations). `blocks` comes this early because most read rules check it.
- [ ] Migration: `places`, `reviews`, `review_media`, `saves`, `collections`, `collection_places`, rules 2 to 4, 8 and 9, `average_rating`, `review_count`, `search_places()`, `create_review()`, `is_username_available()`
- [ ] The `media` bucket and its policies
- [ ] `src/types/database.ts` generated
- [ ] [Demo data](#demo-data): `accounts.json`, `reset.mjs`, `00_helpers.sql`, and `10_people.sql` to `30_saved.sql` for these tables
- [ ] The privacy check below passes for these tables

### B2. People (one person, one PR)

- [ ] Migration: `follows`, `follow_requests`, `close_friends`, `interests` (with the starter list), `profile_interests`, `travel_goals`
- [ ] Demo data: interests and goals in `10_people.sql`, and `40_following.sql`
- [ ] Rules 5 to 7, the profile counts, `friends_rating`, `visible_status`, `visible_home`, `suggestion_reason`, `follow()`, `accept_follow_request()`, `suggested_friends()`, `add_interest()`, `popular_interests()`
- [ ] The privacy check passes for these tables

### B3. Likes, comments, Explore

- [ ] Migration: `review_likes`, `review_comments`, `like_count`, `comment_count`
- [ ] Demo data: `50_reactions.sql`
- [ ] The `city_stats` view
- [ ] `search_profiles()`, once people search has a page

### B4. Accounts

- [ ] The `delete-account` Edge Function, wired to Settings → Account
- [ ] Changing email and password

### The privacy check

Sign in as two demo users. As Kenji, try to read Folake's `settings`, her `profile_locations`, her close friends, her private collections and her saves. Each one has to come back empty. Then check that `visible_status` shows Kenji (her close friend) the city and dates, and shows Amara only the country. Then run the Security Advisor in the dashboard and fix what it reports.

## Demo day

The demo runs on the real backend, starting from the [demo data](#demo-data).

### The day before

- [ ] Run the reset: `node supabase/seed/reset.mjs`.
- [ ] Sign in as Folake, Kenji and Amara, and check Feed, Map, Explore, Saved and Profile.
- [ ] Make sure the project isn't paused. Free projects pause after 7 days without use.
- [ ] Leave "Confirm email" off, so people can sign up on the spot. Supabase's built-in email only reaches the team anyway.
- [ ] Turn on the demo sign-in buttons in the build you'll demo from, with `EXPO_PUBLIC_DEMO_LOGINS=true`. Don't rely on `__DEV__`: it's off in preview builds. That build carries the demo password, so leave the setting off for any real release.
- [ ] Have a phone hotspot ready, and a screen recording of the main flows as a last resort.

### What won't be live

Everything in B1 to B4 works for real. These are under [Later](#later), so they won't be there unless someone builds them first: push notifications, the live 📥 count (it updates on refresh), AI-written summaries (the seeded text stands in), trip overlap, auto-sort and recommendations.

### No offline mode

The mock services go away once each one is on Supabase ([data-layer.md](data-layer.md#phase-2-supabase)). Keeping them as a backup would mean two versions of every service that have to behave the same. The hotspot and the recording are the backup.

## Later

- **Push notifications:** `push_tokens`, `notifications` and the `send-push` function. On the app side, push needs a development build (Expo Go can't receive it), a paid Apple Developer account for iOS, and Firebase credentials for Android, both set up through `eas credentials`.
- **Live inbox:** the 📥 count updates without a refresh. Use Realtime Broadcast, which Supabase recommends: a trigger sends a message to the person's own private channel. Listening to table changes would also work, but it doesn't apply RLS to deletes, so everyone listening would see which requests were deleted.
- **Auto-sort saves:** see [Tables for later](#tables-for-later).
- **Recommendations:** `Place.algorithmRating`, a rating tuned to your interests.
- **AI summaries:** the `summarize-place` function.
- **Trip overlap:** the `trip-overlap` function and `notify_trip_overlap`.
- **Nearest first:** PostGIS and a `places_near(lat, lng)` function, once there are too many places to sort on the phone.
- **Faster search:** a trigram index (`pg_trgm`) on place, city and profile names, once `ilike` gets slow.
- **Find by email or phone:** for `findable_by_contact`.
- **Distance units:** the "Distance units: TBD" row in Settings → Your travel.

## Open decisions

Each has a default, so building isn't blocked. Change the default here if the team decides otherwise.

| # | Question | Default | Why it matters |
| --- | --- | --- | --- |
| 1 | Should places use the shared `cities` list instead of typed city and country? | **Yes.** Upload picks the city with the same picker as Edit profile, plus "Add a city". | Typed names split "Florence" from "florence" and can't tell the two Bostons apart, and Explore groups by city. Changing it after real data exists means migrating that data. |
| 2 | What does a friends-only account hide from people who don't follow it? | **Nothing yet.** It only means new followers need your OK, which is what the settings copy says now. | If posts should be hidden too, the rules for reviews, collections and photos change, and the bucket should be private. |
| 3 | What does "Who can see your Map tab" hide? | **Only the Map tab.** Say so in the settings copy. | Your reviews still show on place pages, so the setting can't hide where you've been. |
| 4 | Are likes and comments on reviews or on places? | **Reviews.** The Feed card's heart likes the review it shows. | "Likes and comments" notifications are about your posts. The comments sheet shows reviews today. |
| 5 | One review per person per place? | **Yes.** Posting about a place again edits your review. | Several reviews from one person would skew a place's rating. |
| 6 | Videos in v1? | **No, photos only.** | The free plan has 1 GB of storage in all. That's a few thousand resized photos, but only a handful of videos. |
| 7 | Where does a new place's location come from? | **Look up the typed address on the phone** with `geocodeAsync` from `expo-location` (a new package). It uses the phone's own geocoder, so there's no API key or bill. It works on iOS and Android but not the web, and Android asks for location permission first. If it finds nothing, the person drops a pin (later). | Without coordinates a place can't go on the map. |
| 8 | Log in with email or username? | **Email.** Supabase Auth signs in by email, and looking up an email from a username would let anyone find people's emails. The username stays as the display handle. | The Login form asks for a username today. |
| 9 | Can other people see your collections? | **Yes, unless they're private.** That's what Settings and Profile already do. | data-layer.md said private. This plan replaces that default. |
| 10 | Who verifies places, and can people edit places they added? | **We verify in the dashboard. No edits in v1.** | |
| 11 | Phone and birthday in Settings → Account? | **Not stored.** Hide the rows until there's a reason to collect them. | Fewer personal details to protect. |
| 12 | How deep can collections nest? | **One level**, as before. | |

## Before we start

- **The project.** Ruby's "Supabase connect" commit added `.env`, so a project may already exist. Check with Ruby and use it rather than making a second one, and add everyone to it in the dashboard.
- **The keys.** New projects only get the new publishable (`sb_publishable_…`) and secret (`sb_secret_…`) keys. If `.env` holds an older `anon` key, swap it for the publishable key: Supabase is removing the old keys by the end of 2026.
- **`.env` is tracked by git.** That's fine for the project URL and the publishable key: `EXPO_PUBLIC_` values can be read out of the app anyway, and Expo's docs allow committing `.env` when it only holds values like these. Never put the secret key or the database password in it; if either was ever committed, rotate it in the dashboard. data-layer.md says to pass the keys around in `.env.local` instead. Either works; pick one and make the other doc match.
- **Client setup has one new step.** Expo's [Supabase guide](https://docs.expo.dev/guides/using-supabase/) now also adds the `expo-sqlite` config plugin to `app.json`. The rest of data-layer.md 2a step 3 still matches it.
- **The free plan** gives each project a 500 MB database, 1 GB of file storage, 5 GB of data out a month (plus 5 GB served from cache) and 50,000 monthly users, with 2 free projects per account. **A project pauses after 7 days without much use.** Anyone on the team can resume it from the dashboard, but open the app the day before a demo to be sure.
- **data-layer Phase 0** (React Query) can happen alongside B1. Switching a service to Supabase doesn't need it, but the hooks do.

## What changed from the old schema

For anyone who read [supabase-schema.sql](supabase-schema.sql):

- `friendships` (two-way, with requests) is now `follows` and `follow_requests`, plus `close_friends` and `blocks`.
- `profiles` lost `home_country`, `current_country`, `interests` and `auto_sort_saves`. Home city and travel status moved to the private `profile_locations`. Interests have their own tables. `auto_sort_saves` moves to `settings` with auto-sort.
- `profiles` gained `avatar_hue`, `cover_mode`, `cover_path`, `dream_trip_city_id` and `account_type`.
- New tables: `settings`, `profile_locations`, `cities`, `place_types`, `suited_for_tags`, `interests`, `profile_interests`, `travel_goals`, `review_likes`, `review_comments`, `follow_requests`, `close_friends`, `blocks`.
- `places` uses `city_id` in place of `city` and `country`.
- Collections can be public now, with `is_private`, and gained `emoji` and `updated_at`.
- `suggested_friends()` uses follows, skips blocked people and anyone who turned suggestions off, and gives a reason.
- `friends_rating` averages the people you follow.
- New: `visible_status`, `visible_home`, `follow()`, `accept_follow_request()`, `search_places()`, `create_review()`, `is_username_available()`, `add_interest()`, `popular_interests()`, `city_stats`, and the `delete-account` Edge Function.
- The old SQL has no grants, leaves every function runnable by everyone, and keeps its `security definer` function in `public`. New Supabase projects need all three handled ([writing migrations](#writing-migrations)).
