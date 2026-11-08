# Data layer plan

How screens get, save and share data, all of it from the Supabase backend. Read this before writing code that loads or saves data, signs people in, or touches Supabase.

Each phase ends with a checklist. Tick the boxes in the same PR as the work.

## For Claude Code sessions

- Read this whole file before working on data, auth or Supabase. Then check what's actually built: the checklists can fall behind, so look for the files they name.
- Every screen and component follows the rules below. `npm run lint` enforces rules 1 and 3: importing `@/lib/supabase` outside `src/services/`, or a service's functions into `src/app/` or `src/components/`, is a lint error. Importing a service's types (`import type`) is fine.
- Need data a hook doesn't give yet? Add the service function, then a hook around it, then use the hook. Don't call the service from the screen.
- If you add a service function, hook, query key or mutation, add it to the tables in this file in the same change.
- Run `npm run lint` and `npx tsc --noEmit` before you finish.

## The rules

1. **Screens and components never fetch data themselves.** They call hooks from `src/hooks/`, never a service from a `useEffect`. Lint enforces this.
2. **Hooks wrap services.** Each hook is a thin `useQuery` or `useMutation` around a function in `src/services/`.
3. **Only services talk to the backend.** Nothing outside `src/services/` imports the Supabase client, except `use-session.tsx` for signing in and out. Lint enforces this.
4. **The database is the source of truth.** The React Query cache is a copy of it. Writes go to the server straight away. The cache updates first so the app feels instant, and goes back if the write fails. There's no "save locally, sync later".
5. **Context only holds the session**, meaning who's signed in. Places, saves, collections and friends live in the query cache, not in context.
6. **Anything that depends on who's signed in is its own query, not a field on shared data.** "Is this place saved?" comes from `useIsSaved(placeId)`, not `place.bookmark`. The same goes for "is this person my friend?".
7. **Services throw when something fails** (`if (error) throw error`), so hooks can show an error and undo optimistic changes.
8. **Query keys only come from `src/lib/query-keys.ts`.** Never type a key like `['saves']` inline.
9. **Services never take the signed-in user's id.** Write `getCollections()`, not `getCollections(userId)`. The services get it from the session: `currentUserId()` in `src/lib/supabase.ts`, column defaults (`default auth.uid()`) and row level security. Functions about *someone else* do take an id, e.g. `getProfile(id)`.
10. **The database keeps its own rules** (unsaving a place takes it out of your collections, blocking ends follows, and so on: [backend-plan.md](backend-plan.md#rules-the-database-keeps)). Services don't repeat them. A mutation invalidates whatever those rules change, so the screens refetch it.

## Where state lives

| Kind of state | Where | Examples |
| --- | --- | --- |
| Who's signed in | `SessionProvider` context, read with `useSession()` | the user, sign in, sign out |
| Anything stored in the backend | React Query cache, through hooks in `src/hooks/` | places, saves, collections, reviews, profiles, friends |
| UI state on one screen | `useState` | selected filter pill, search text, form fields, which sheet is open |

Why not keep the user's data in context: every change would re-render every screen that reads it, and loading, errors, refetching and staying in sync would all need to be written by hand for each kind of data. React Query already does all of that.

## Folders

```
src/app/         Screens. Call hooks; show the loading, error, empty and loaded states.
src/components/  Same rule as screens: hooks, not services.
src/hooks/       One file per kind of data (use-saves.ts, use-places.ts, ...): useQuery / useMutation around services.
src/lib/         query-client.ts, query-keys.ts and supabase.ts.
src/services/    Plain async functions that query Supabase. The only place that imports the client.
src/utils/       Pure helpers with no backend: validatePost, formatStatusText, trimStatusForLevel, ...
supabase/        Migrations, seed data and database tests. The database schema, checked into git.
```

## Worked example: saving a place

The bookmark shows the pattern that every other change follows.

1. `BookmarkButton` is filled when `useIsSaved(place.id)` is true.
2. Tapping it calls `toggleSave.mutate({ placeId, save: !isSaved })`.
3. `onMutate` changes the cached list of saved ids straight away, so every bookmark for that place flips on every screen at once.
4. The service writes to the backend.
5. If the write fails, `onError` puts the old list back.
6. `onSettled` marks saves and collections as out of date, so the Saved and Collection pages refetch. Tab screens stay mounted, so they update without `useFocusEffect`.

```ts
// src/hooks/use-saves.ts
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { getSavedPlaceIds, savePlace, unsavePlace } from '@/services/collections';

// Ids of every place the signed-in user has saved. Fetched once and shared by every bookmark.
const savedIdsQuery = queryOptions({
  queryKey: queryKeys.saves.ids,
  queryFn: getSavedPlaceIds,
});

export function useSavedPlaceIds() {
  return useQuery(savedIdsQuery);
}

// Whether one place is saved. `select` picks this place's answer out of the shared list.
export function useIsSaved(placeId: string): boolean {
  const { data } = useQuery({ ...savedIdsQuery, select: (ids) => ids.includes(placeId) });
  return data ?? false;
}

type ToggleSave = { placeId: string; save: boolean };

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ placeId, save }: ToggleSave) => (save ? savePlace(placeId) : unsavePlace(placeId)),

    // Flip the bookmark straight away, before the server answers
    onMutate: async ({ placeId, save }) => {
      // Stop a refetch that's already running from overwriting the change
      await queryClient.cancelQueries({ queryKey: queryKeys.saves.ids });
      const previous = queryClient.getQueryData<string[]>(queryKeys.saves.ids);
      queryClient.setQueryData<string[]>(queryKeys.saves.ids, (ids = []) =>
        save ? [...ids, placeId] : ids.filter((id) => id !== placeId),
      );
      return { previous };
    },

    // The server said no: put the old list back
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.saves.ids, context?.previous);
    },

    // Either way, refetch everything that depends on what's saved
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
```

In a component:

```tsx
const isSaved = useIsSaved(place.id);
const toggleSave = useToggleSave();

<BookmarkButton
  isSaved={isSaved}
  onPress={() => toggleSave.mutate({ placeId: place.id, save: !isSaved })}
/>
```

### Reading with filters (Feed, Map)

```ts
// src/hooks/use-places.ts
export function usePlaces(filters: PlaceFilters) {
  return useQuery({
    queryKey: queryKeys.places.list(filters),
    queryFn: () => getPlaces(filters),
    // While new results load, keep showing the old ones instead of a spinner
    placeholderData: keepPreviousData,
  });
}
```

Each set of filters gets its own cache entry, and answers for old filters are ignored, so screens don't need an `ignore` flag in a `useEffect`.

### Showing a change while it saves

Two ways, depending on the data:

- **Change the cache in `onMutate`** when several screens show the same thing, like saves, likes and settings. Every screen flips at once, and `onError` puts it back.
- **Show the mutation's `variables` while `isPending`** when only one screen shows it. Your travel does this with the goal: `useUpdateProfile` stays pending until the fresh profile has loaded, so nothing flickers back.

### Showing states

| Hook value | Show |
| --- | --- |
| `isPending` | the loading state (spinner or gray placeholders) |
| `isError` | the error message, with a "Try again" button that calls `refetch()` |
| `data` is empty | the empty state from the page's doc in `docs/pages/` |
| pull to refresh | keep a local `refreshing` flag around `await refetch()`, the way the Feed does now. Don't use `isRefetching`, because it's also true during background refetches. |
| a mutation's `isPending` | disable the button and show a spinner (Upload's Post button, for example) |

## Query keys

Every key is in `src/lib/query-keys.ts`. Add a new one there before a hook uses it. Keys are nested, so invalidating `saves.all` (`['saves']`) also refreshes everything that starts with `'saves'`.

| Group | Keys |
| --- | --- |
| `places` | `all`, `list(filters)`, `detail(id)`, `byIds(ids)`, `types`, `tags` |
| `cities` | `all`, `list(filters)`, `detail(id)`, `places(id)`, `pick(id)`, `search(query)` |
| `reviews` | `all`, `byUser(userId)`, `likedIds` |
| `saves` | `all`, `ids`, `places` ("All saved"), `loose` (saved but in no collection) |
| `collections` | `all`, `mine`, `ofProfile(ownerId)`, `detail(id)` |
| `profiles` | `all`, `detail(id)`, `byIds(ids)`, `usernameAvailable(username)` |
| `follows` | `all`, `followers(userId)`, `following(userId)`, `requests`, `suggestions`, `friendUsernames` |
| `settings` | `all` |
| `interests` | `all`, `byIds(ids)`, `popular(limit)`, `search(query)`, `suggested` |

When the signed-in user changes (signing out, or switching demo user), `SessionProvider` calls `queryClient.clear()`, so the next person never sees the last person's data.

## Contracts

Screens build against the hooks, and hooks against these services. Names marked **add** aren't built yet. This list replaces the Services table in [pages/README.md](pages/README.md#services). It differs on purpose in two places: services don't take the signed-in user's id, and v1 collections hold places only.

### Services

What exists, on Supabase. Functions about the signed-in user don't take their id (rule 9); functions about someone else do. When you add or change one, update this table in the same change.

| File | Function | Notes |
| --- | --- | --- |
| `places.ts` | `getPlaces(filters): Place[]` | `search_places()`, with ratings, city and reviews |
| | `getPlace(id): Place \| null` | with all its reviews |
| | `getPlaceTypes()`, `getSuitedForTags(): string[]` | the filter lists, from the database |
| | `getPlacesByIds(ids): Place[]` | several places in one request, e.g. the ones a profile reviewed |
| `collections.ts` | `getSavedPlaceIds(): string[]` | |
| | `savePlace(placeId)` / `unsavePlace(placeId)` | unsaving also takes the place out of every collection (a database rule) |
| | `getAllSavedPlaces()`, `getSavedPlaces(): Place[]` | every save; the loose ones |
| | `getCollections()`, `getCollectionsForProfile(ownerId): Collection[]` | yours; someone's, without their private ones |
| | `getCollection(id): Collection \| null` | handles `ALL_SAVED_ID` |
| | `removeFromCollection(collectionId, placeId)` | the place stays saved |
| | `getSavedCollectionIds(placeId)`, `createCollection`, `renameCollection`, `deleteCollection`, `addToCollection` | **add** for the save sheet |
| `posts.ts` | `createPost(fields: UploadFields): SavedPost` | uploads the photos, then `create_review()`, which adds the city and place if they're new |
| `reviews.ts` | `getReviewsByAuthor(authorId): AuthoredReview[]` | |
| | `getLikedReviewIds(): string[]` | every review the signed-in user liked |
| | `likeReview(reviewId)`, `unlikeReview(reviewId)` | |
| `users.ts` | `getProfile(id): Profile \| null` | yours has your full `status`; anyone's has the trimmed `visibleStatus` |
| | `getProfilesByIds(ids): Profile[]` | several people in one request, in the order given (followers, blocked accounts) |
| | `updateProfile(changes)` | the signed-in user only; routes each field to its table |
| | `isUsernameAvailable(username)` | works signed out |
| | `getSuggestedFriends(): SuggestedFriend[]` | with each reason ("Also in Lisbon", "3 mutuals") |
| | `getFriendUsernames(): string[]` | the people you follow |
| `follows.ts` | `getFollowerIds(userId)`, `getFollowingIds(userId)`, `isFollowing(userId)` | |
| | `followUser(userId): 'following' \| 'requested'` | a friends-only account gets a request |
| | `unfollowUser(userId)`, `setNotifyPrefs(userId, prefs)` | |
| | `getFollowRequests()`, `acceptFollowRequest(fromId)`, `declineFollowRequest(fromId)` | the 📥 inbox |
| `settings.ts` | `getSettings()`, `updateSettings(changes)` | put together from four tables |
| | `addCloseFriend(id)`, `removeCloseFriend(id)`, `blockUser(id)`, `unblockUser(id)` | |
| `interests.ts` | `getInterestsByIds(ids)`, `searchInterests(query)`, `getPopularInterests(limit)`, `suggestInterestsFromPosts()`, `addInterest(name)` | |
| `cities.ts` | `getCities(filters)`, `getCity(id)`, `getCityPlaces(id)` | the `city_stats` view |
| `profile-cities.ts` | `getProfileCity(id)`, `searchProfileCities(query)` | the `cities` table |
| `media.ts` | `uploadMedia(localUri, folder)`, `getMediaUrl(path)`, `deleteMedia(paths)` | photos in the `media` bucket |
| `place-rows.ts` | `PLACE_SELECT`, `toPlace`, `toReview` | shared by the services that return places. Nothing per-user: "saved?" and "liked?" are their own queries (rule 6) |
| `mock-backend.ts` | `mockRequest(data)` | only `template-service.ts` uses it now |

Helpers that don't touch the backend live in `src/utils/`: `validatePost(fields)` (Upload's form check, in `validate-post.ts`) and `formatStatusText` / `trimStatusForLevel` (Edit profile's and Privacy's previews, in `status-text.ts`; the database trims everyone else's status).

### Hooks

Every hook that takes one id also accepts `undefined`, and waits until the id is set (`skipToken`). So a screen can call it before it knows the id.

| File | Hooks | Wraps | Used by |
| --- | --- | --- | --- |
| `use-session.tsx` | `SessionProvider`, `useSession()` returns `{ user, isLoading, signIn, signUp, signInAsDemoUser, signOut, deleteAccount }`; `useUserId()` | Supabase Auth | root layout, Login, Create account, Settings, Profile |
| `use-places.ts` | `usePlaces(filters)`, `usePlace(id)`, `usePlacesByIds(ids)` | `getPlaces`, `getPlace`, `getPlacesByIds` | Feed, Map, Place details, Profile |
| | `useFilterOptions()` returns `{ placeTypes, suitedFor }` | `getPlaceTypes`, `getSuitedForTags` | Feed, Map, Explore |
| `use-saves.ts` | `useSavedPlaceIds()`, `useIsSaved(placeId)`, `useToggleSave()` | `getSavedPlaceIds`, `savePlace` / `unsavePlace` | `PlaceCard`, Place details, Collection |
| | `useAllSavedPlaces()`, `useLooseSavedPlaces()` | `getAllSavedPlaces`, `getSavedPlaces` | Saved |
| `use-collections.ts` | `useCollections()`, `useCollectionsForProfile(ownerId)`, `useCollection(id)`, `useRemoveFromCollection()`; re-exports `ALL_SAVED_ID` | `getCollections`, `getCollectionsForProfile`, `getCollection`, `removeFromCollection` | Saved, Profile, Collection |
| | `useCollectionsContaining(placeId)`, `useCreateCollection()`, `useRenameCollection()`, `useDeleteCollection()`, `useAddToCollection()` | **add** with the save sheet | |
| `use-reviews.ts` | `useReviewsByUser(userId)`, `useIsLiked(reviewId)`, `useToggleLike()` | `getReviewsByAuthor`, `getLikedReviewIds`, `likeReview` / `unlikeReview` | Profile, `PlaceCard` |
| | `useCreatePost()` | `createPost` | Upload |
| `use-profiles.ts` | `useProfile(id)`, `useProfilesByIds(ids)`, `useUpdateProfile()` | `getProfile`, `getProfilesByIds`, `updateProfile` | Profile, Edit profile, Settings |
| | `useCheckUsername()` returns `(username) => Promise<boolean>` | `isUsernameAvailable` | Create account, Edit profile |
| `use-follows.ts` | `useFollowerIds(userId)`, `useFollowingIds(userId)`, `useFollowRequests()`, `useSuggestedFriends()`, `useFriendUsernames()` | `follows.ts`, `getSuggestedFriends`, `getFriendUsernames` | Profile, Map, Privacy, Close friends |
| | `useFollow()`, `useUnfollow()`, `useAcceptFollowRequest()`, `useDeclineFollowRequest()` | `followUser`, `unfollowUser`, `acceptFollowRequest`, `declineFollowRequest` | Profile |
| `use-settings.ts` | `useSettings()`, `useUpdateSettings()`, `useToggleCloseFriend()`, `useBlockUser()`, `useUnblockUser()` | `settings.ts` | Settings screens |
| `use-interests.ts` | `useInterestsByIds(ids)`, `usePopularInterests(limit, enabled?)`, `useSearchInterests(query)`, `useSuggestedInterests(enabled?)`, `useAddInterest()` | `interests.ts` | Profile, Edit profile |
| `use-cities.ts` | `useCities(filters)`, `useCity(id)`, `useCityPlaces(id)` | `cities.ts` | Explore, City |
| | `useProfileCity(id)`, `useCitySearch(query)` | `profile-cities.ts` | Profile, Edit profile |

### Mutations and what they refresh

| Mutation hook | Changes the cache first? | Then invalidates |
| --- | --- | --- |
| `useToggleSave` | yes, `saves.ids` | `saves.all`, `collections.all` (unsaving uncollects) |
| `useToggleLike` | yes, `reviews.likedIds` | `reviews.likedIds` |
| `useRemoveFromCollection` | no | `collections.all`, `saves.all` |
| `useCreatePost` | no | `places.all`, `cities.all`, `reviews.all`, `collections.all`, `saves.all`, `interests.suggested` |
| `useUpdateProfile` | no; stays pending until the fresh profile loads | `profiles.all`, `interests.all`, `follows.suggestions` |
| `useFollow`, `useUnfollow`, `useAcceptFollowRequest`, `useDeclineFollowRequest` | no | `follows.all`, `profiles.all`, `places.all` (friends' ratings change) |
| `useUpdateSettings` | yes, `settings.all` | `settings.all`, `follows.all` (friends-only off accepts requests), `profiles.all` |
| `useToggleCloseFriend` | yes, `settings.all` | `settings.all` |
| `useUnblockUser` | yes, `settings.all` | `settings.all`, `follows.all`, `profiles.all` |
| `useBlockUser` | no | `settings.all`, `follows.all` (blocking ends follows), `profiles.all` |
| `useAddInterest` | no | `interests.all` |
| save sheet: `useAddToCollection`, `useCreateCollection`, `useRenameCollection`, `useDeleteCollection` | **add** | `collections.all`, and `saves.all` for add and delete |

## Type changes

| Type | Change | When |
| --- | --- | --- |
| `Place` | Remove `bookmark` and `addToList`. Use `useIsSaved(place.id)` instead. | Done |
| `Place` | Make `proximity` optional. It depends on where the phone is, so it can't come from the database. Only show the distance when it's set. | Done |
| `Place` | Keep `reviews?`. `getPlace` fills in all of them, and `getPlaces` can fill in just the newest one for the Feed card. | — |
| `Review` | Add `authorId`. Keep `profileName` as the username to show; the service fills it in from the author's profile. | Done |
| `Review` | Remove `likedByMe`. Use `useIsLiked(review.id)` instead. | Done |
| `Profile` | Remove `friendIds` and `postIds`. Use `useFollowerIds(id)`, `useFollowingIds(id)` and `useReviewsByUser(id)`. | Done |
| `Collection` | No change. Services build `places` and `subCollections` from the database. | — |
| `src/types/database.ts` | Generated from the database. Never edit it by hand. | Done |

## Phase 0: Foundation

**Done** on the `supabase-backend` branch, after Phase 2 rather than before it. The services were already on Supabase, so the mock steps (5 and 6) were skipped. The steps are kept as the record.

1. `npx expo install @tanstack/react-query`
2. Create `src/lib/query-client.ts`:

   ```ts
   import { focusManager, QueryClient } from '@tanstack/react-query';
   import { AppState, Platform } from 'react-native';

   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 30_000, // reuse data for 30 seconds before refetching it
         retry: 1,
       },
     },
   });

   // Refetch stale data when the app comes back to the foreground. The web does this by itself.
   if (Platform.OS !== 'web') {
     AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
   }
   ```

3. Create `src/lib/query-keys.ts` from [Query keys](#query-keys).
4. Wrap the `Stack` in `src/app/_layout.tsx` with `<QueryClientProvider client={queryClient}>`.
5. Add `getMockUserId()` / `setMockUserId()` to `mock-backend.ts`.
6. In `collections.ts`, add mock `getSavedPlaceIds`, `savePlace` and `unsavePlace`, replacing the "NOT BUILT YET" note. Keep its auto-sort notes for Phase 3. Remove `toggleBookmark` from `places.ts`, and `bookmark` / `addToList` from `Place` and the mock data.
7. Create `src/hooks/use-saves.ts` from the [worked example](#worked-example-saving-a-place). Use it in `PlaceCard` (Feed) and `PlaceDetails` in place of `place.bookmark` and the local `isBookmarked` state.
8. Lint and typecheck.

- [x] React Query installed and provided in the root layout
- [x] `src/lib/query-client.ts` and `src/lib/query-keys.ts`
- [x] ~~Mock current user in `mock-backend.ts`~~ Not needed: services read the user from the Supabase session
- [x] Saves in `collections.ts` (on Supabase); `Place.bookmark`, `addToList` and `toggleBookmark` removed
- [x] `src/hooks/use-saves.ts`, used by Feed and Place details

## Phase 1: Connect screens to hooks

**Done** on the `supabase-backend` branch, against Supabase rather than mock data. Every screen and component now reads and writes through the hooks in [Contracts](#hooks), and lint stops new code from calling services directly. The table below is the original plan; the hooks table above has the names as built (for example `useCreatePost` rather than `useCreateReview`, and the follow hooks rather than `useFriends`).

| Page | File | Hooks | Gets rid of |
| --- | --- | --- | --- |
| Session and login gate | `src/hooks/use-session.tsx`, `login.tsx`, `create-account.tsx`, `_layout.tsx` | `useSession()` | "Login is not connected yet"; the temporary "Go to login" link. Plan: [01-login.md](pages/01-login.md) |
| Feed | `(tabs)/index.tsx` | `usePlaces(filters)` | the `ignore` `useEffect` and `load()` |
| Map | `(tabs)/map.tsx` | `usePlaces(filters)` | the `ignore` `useEffect`. Keep the camera logic in a `useEffect` that runs when the places change. |
| Place details | `place/[id].tsx` | `usePlace(id)` | the `useEffect` |
| Saved | `(tabs)/saved.tsx` | `useCollections()`, `useLooseSavedPlaces()`, `useAllSavedPlaces()` | three `.then` calls; the "reload on focus" TODO |
| Collection | `collection/[id].tsx` | `useCollection(id)`, `useRemoveFromCollection()` | the `useFocusEffect` TODO |
| Save sheet (new) | `save-to-collection.tsx` | `useCollections()`, `useCollectionsContaining(placeId)`, `useAddToCollection()`, `useRemoveFromCollection()`, `useCreateCollection()` | Bookmark taps open this instead of toggling directly. Plan: [05](pages/05-saved-collections.md) |
| Profile | `(tabs)/profile.tsx` | `useSession()`, `useProfile(id)`, `useReviewsByUser(id)`, `useFriends(id)`, `useSuggestedFriends()` | `CURRENT_USER_ID`; the `useFocusEffect` fetch; the reviews TODO |
| Edit profile (new) | `edit-profile.tsx` | `useUpdateProfile()` | |
| Upload | `upload.tsx` | `useCreateReview()`, `usePlaces({ query })` for suggestions | |

The session is on Supabase Auth ([2b](#2b-auth-login-owner)). Signing in as someone else clears the query cache.

- [x] Session, login gate and demo users (on Supabase Auth)
- [x] Feed
- [x] Map
- [x] Place details
- [x] Saved
- [x] Collection
- [ ] Save sheet (not built yet; a bookmark tap still toggles)
- [x] Profile (with `Review.authorId`; `Profile.friendIds` and `postIds` removed)
- [x] Edit profile
- [x] Upload
- [x] Explore and City (not in the original plan)
- [x] Settings: Privacy, Notifications, Close friends, Blocked, Your travel; and Create account's username check

## Phase 2: Supabase

**Built** on the `supabase-backend` branch: the database, sign-in, and every service. [backend-plan.md](backend-plan.md) has the design, and its "What changed while building" section. The README's "The backend (Supabase)" section has the setup: everyone uses the shared project, and running Supabase locally is for database work. The steps below are kept as the record; where they disagree with backend-plan.md or the code, those win.


### 2a. Setup (one person, one PR)

1. Create one Supabase project for the team to share during development. In the dashboard's Authentication settings for email sign-in, turn off "Confirm email" so test accounts work right away.
2. Put the keys in `.env.local`, which git ignores, and share the file in the group chat:

   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

   The publishable key is safe to ship in the app because row level security protects the data. **Never put the secret key (or `service_role` key) or the database password in the app.**
3. `npx expo install @supabase/supabase-js expo-sqlite`, then create `src/lib/supabase.ts` following the [Expo Supabase guide](https://docs.expo.dev/guides/using-supabase/). Add the generated `Database` type, `createClient<Database>(...)`, so queries are type-checked:

   ```ts
   import 'expo-sqlite/localStorage/install';
   import { createClient } from '@supabase/supabase-js';
   import { AppState } from 'react-native';

   import type { Database } from '@/types/database';

   export const supabase = createClient<Database>(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
     {
       auth: {
         storage: localStorage, // keeps people signed in after the app closes
         autoRefreshToken: true,
         persistSession: true,
         detectSessionInUrl: false,
       },
     },
   );

   // Only refresh the sign-in token while the app is open
   AppState.addEventListener('change', (state) => {
     if (state === 'active') {
       supabase.auth.startAutoRefresh();
     } else {
       supabase.auth.stopAutoRefresh();
     }
   });
   ```

   `expo-sqlite` has native code, so everyone needs to rebuild their development build afterwards (`npx expo run:ios` or `npx expo run:android`).
4. Set up the CLI and the first migration:

   ```bash
   npx supabase init
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase migration new initial_schema
   ```

   Done differently: the schema is three migrations in `supabase/migrations/` (core, people, reactions). Push them with `npx supabase db push`.
5. Done differently: the demo data is one file per system in `supabase/seed/`, and `npm run demo:reset` creates the demo accounts and loads it (backend-plan.md, "Demo data").
6. `npx supabase gen types --schema public > src/types/database.ts` from the local stack, or with `--remote` from the linked project. (CLI v3 replaced `--linked` and `--lang`.)
7. The **public** `media` bucket and its policies are created by the core migration (see [Media](#media)).

### 2b. Auth (Login owner)

Change `SessionProvider` to use Supabase Auth:

- On start, read `supabase.auth.getSession()`. After that, keep the user up to date with `supabase.auth.onAuthStateChange`.
- `signIn(email, password)` calls `signInWithPassword`. `signUp` calls `supabase.auth.signUp({ email, password, options: { data: { username, name } } })`, and a database trigger creates the profile from `username` and `name`.
- `signOut()` calls `supabase.auth.signOut()` and then `queryClient.clear()`.
- Supabase signs in with **email**, so the Login form asks for email instead of username (see [Open decisions](#open-decisions)).
- The demo user buttons show when `EXPO_PUBLIC_DEMO_LOGINS=true`, not only in development builds, so they work in the build you demo from.

### 2c. Move services to Supabase (one PR per file, any order after 2a)

Only the insides of each function change. Convert database rows (`snake_case`) into the app's types (`camelCase`) inside the service, so screens never change.

All of them wait for 2b, not just 2a: signed-out people can't read anything, so a service can't work against Supabase until the session does. Then `places.ts` goes first, since the others read places.

```ts
// src/services/collections.ts
import { supabase } from '@/lib/supabase';

export async function getSavedPlaceIds(): Promise<string[]> {
  // Row level security only returns the signed-in user's saves
  const { data, error } = await supabase.from('saves').select('place_id');
  if (error) throw error;
  return data.map((row) => row.place_id);
}

export async function savePlace(placeId: string): Promise<void> {
  // user_id fills itself in from the session
  const { error } = await supabase.from('saves').insert({ place_id: placeId });
  if (error) throw error;
}

export async function unsavePlace(placeId: string): Promise<void> {
  // A database trigger also takes it out of the user's collections
  const { error } = await supabase.from('saves').delete().eq('place_id', placeId);
  if (error) throw error;
}
```

Reading a place along with its calculated ratings and its reviews' authors:

```ts
const { data, error } = await supabase
  .from('places')
  .select('*, average_rating, friends_rating, reviews(*, profiles(username))')
  .eq('id', id)
  .maybeSingle();
```

Remember to throw when something fails, and build `directions` from the coordinates.

- [x] 2a. Project, client, CLI, first migration, seed, generated types, storage bucket
- [x] 2b. Session uses Supabase Auth
- [x] `places.ts`
- [x] `collections.ts`
- [x] `reviews.ts` and `media.ts`
- [x] `users.ts`
- [x] `follows.ts`, `settings.ts`, `interests.ts`, `cities.ts`, `profile-cities.ts` and `posts.ts` (there's no `friends.ts`: the app has follows)
- [ ] `mock-backend.ts` deleted (only `template-service.ts` still imports it)

### The schema

The schema is in `supabase/migrations/`, and [backend-plan.md](backend-plan.md) explains it: the tables, who can see what, the functions, the rules the database keeps, and the demo data. It replaced `supabase-schema.sql`, which was written before follows, settings and privacy existed.

### Media

Store photos in the `media` bucket at `<user id>/<file name>`. Store only that path in the database, never the full URL. To upload, read the picked file as bytes and pass it to `supabase.storage.from('media').upload(path, bytes, { contentType })`. Supabase's [Expo user management tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) shows the whole flow, using `fetch(uri).then((res) => res.arrayBuffer())`. To show a photo, use `supabase.storage.from('media').getPublicUrl(path)`.

The core migration creates the bucket and policies like this one, so people can only upload into (and replace or delete from) their own folder. `src/services/media.ts` shrinks photos and uploads them:

```sql
create policy "media: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

### Changing the schema later

- Make a new migration for each change (`npx supabase migration new <what-changed>`). **Never edit a migration that's already been pushed.**
- After the PR is merged, whoever merged it runs `npx supabase db push`, then regenerates `src/types/database.ts` (`npx supabase gen types --schema public --remote > src/types/database.ts`) and commits it.
- Every new table needs `enable row level security`, policies and grants in the same migration ([backend-plan.md, "Writing migrations"](backend-plan.md#writing-migrations)). A table without policies or grants can't be read or written from the app. A table with RLS turned off can be read and written by anyone signed in.
- Add a check to `supabase/tests/` for every new privacy rule, and run `npx supabase test db`.

## Phase 3: Later

- **Auto-sort.** `profiles.auto_sort_saves` already exists. Add `match_country`, `match_city` and `match_place_type` to `collections`, plus an `after insert` trigger on `saves` that adds the place to matching collections. First answer the open questions in the `collections.ts` note.
- **Distance.** Get the phone's location with `expo-location`, and fill in `proximity` in the service or hook.
- **Live follow requests**, using Supabase Realtime on `follow_requests`.
- **AI summaries**, written by an Edge Function when reviews change, and stored in `places.ai_summary`.
- **Search debounce.** Wait about 300 ms after typing stops before the search text goes into the query key, so it's not one request per keystroke.

## Open decisions

Each one has a default, so work isn't blocked. Change the default here if the team decides otherwise.

| Question | Default |
| --- | --- |
| Sign in with email or username? | **Email.** Supabase Auth signs in by email, and looking up an email from a username would let anyone find people's emails. The username stays as the display handle. |
| Friend requests, or follow without approval? | **Follows**, with requests only for friends-only accounts. That's what the app built. |
| Does a bookmark tap toggle, or open the save sheet? | **Open the sheet**, as planned in [05](pages/05-saved-collections.md). Until the sheet exists, it toggles. |
| Can friends see your collections? | **Yes, unless they're private** (the Settings and Profile pages already worked this way). See backend-plan.md, open decision 9. |
| How deep can collections nest? | **One level.** `createCollection` refuses a parent that already has a parent. |
| Who can read reviews? | **Anyone signed in.** |
