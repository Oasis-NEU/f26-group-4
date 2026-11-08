# Data layer plan

How screens get, save and share data: with mock services now, and with Supabase later. Read this before writing code that loads or saves data, signs people in, or touches Supabase.

Each phase ends with a checklist. Tick the boxes in the same PR as the work.

## For Claude Code sessions

- Read this whole file before working on data, auth or Supabase. Then check what's actually built: the checklists can fall behind, so look for the files they name.
- If the step you need isn't built yet (for example, `src/lib/query-client.ts` doesn't exist), don't set it up inside a feature branch. Several people doing that at once means merge conflicts in `package.json` and `_layout.tsx`. Tell the user which step the work is waiting on, and keep building the UI against the service functions as they are.
- Follow the rules below even where older code doesn't. Most existing screens were written before this plan.
- If you add a service function, hook or mutation, add it to the tables in this file in the same change.
- Run `npm run lint` and `npx tsc --noEmit` before you finish.

## The rules

1. **Screens and components never fetch data themselves.** They call hooks from `src/hooks/`. New code doesn't call services from a `useEffect`.
2. **Hooks wrap services.** Each hook is a thin `useQuery` or `useMutation` around a function in `src/services/`.
3. **Only services talk to the backend.** Nothing outside `src/services/` imports the Supabase client, except `use-session.tsx` for signing in and out. Moving from mock data to Supabase only changes the insides of service functions.
4. **The database is the source of truth.** The React Query cache is a copy of it. Writes go to the server straight away. The cache updates first so the app feels instant, and goes back if the write fails. There's no "save locally, sync later".
5. **Context only holds the session**, meaning who's signed in. Places, saves, collections and friends live in the query cache, not in context.
6. **Anything that depends on who's signed in is its own query, not a field on shared data.** "Is this place saved?" comes from `useIsSaved(placeId)`, not `place.bookmark`. The same goes for "is this person my friend?".
7. **Services throw when something fails** (`if (error) throw error`), so hooks can show an error and undo optimistic changes.
8. **Query keys only come from `src/lib/query-keys.ts`.** Never type a key like `['saves']` inline.
9. **Services never take the signed-in user's id.** Write `getCollections()`, not `getCollections(userId)`. Mock services get it from `getMockUserId()` in `mock-backend.ts`. Supabase gets it from the session through column defaults and row level security. Functions about *someone else* do take an id, e.g. `getProfile(id)`.
10. **Mock services follow the same rules as the database.** If the database removes a place from your collections when you unsave it, the mock should too. Otherwise the UI will rely on behavior the real backend won't have.

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
src/hooks/       One file per kind of data (use-saves.ts, use-places.ts, ...): useQuery / useMutation around services.
src/lib/         query-client.ts, query-keys.ts, and supabase.ts in Phase 2.
src/services/    Plain async functions. Mock data now; Supabase queries in Phase 2.
supabase/        Migrations and seed data (Phase 2). The database schema, checked into git.
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

Each set of filters gets its own cache entry, and answers for old filters are ignored. That means the `ignore` flag in the Feed and Map `useEffect`s isn't needed any more.

### Showing states

| Hook value | Show |
| --- | --- |
| `isPending` | the loading state (spinner or gray placeholders) |
| `isError` | the error message, with a "Try again" button that calls `refetch()` |
| `data` is empty | the empty state from the page's doc in `docs/pages/` |
| pull to refresh | keep a local `refreshing` flag around `await refetch()`, the way the Feed does now. Don't use `isRefetching`, because it's also true during background refetches. |
| a mutation's `isPending` | disable the button and show a spinner (Upload's Post button, for example) |

## Query keys

`src/lib/query-keys.ts`. Keys are nested, so invalidating `saves.all` (`['saves']`) also refreshes everything that starts with `'saves'`.

```ts
import type { PlaceFilters } from '@/services/places';

export const queryKeys = {
  places: {
    all: ['places'] as const,
    list: (filters: PlaceFilters) => ['places', 'list', filters] as const,
    detail: (id: string) => ['places', 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
  },
  saves: {
    all: ['saves'] as const,
    ids: ['saves', 'ids'] as const, // every saved place id
    places: ['saves', 'places'] as const, // every saved place, for "All saved"
    loose: ['saves', 'loose'] as const, // saved but not in a collection
  },
  collections: {
    all: ['collections'] as const,
    list: ['collections', 'list'] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
    containing: (placeId: string) => ['collections', 'containing', placeId] as const,
  },
  profiles: {
    detail: (id: string) => ['profiles', id] as const,
  },
  friends: {
    all: ['friends'] as const,
    of: (userId: string) => ['friends', 'of', userId] as const,
    requests: ['friends', 'requests'] as const,
    suggested: ['friends', 'suggested'] as const,
  },
};
```

When someone signs out or switches demo user, the session calls `queryClient.clear()`, so the next person never sees the last person's saves.

## Contracts

UI work can build against these names now. Functions marked **add** need a mock version first, written the same way as the existing ones. This list replaces the Services table in [pages/README.md](pages/README.md#services). It differs on purpose in two places: services don't take the signed-in user's id, and v1 collections hold places only.

### Services

| File | Function | Status |
| --- | --- | --- |
| `places.ts` | `getPlaces(filters): Place[]` | exists |
| | `getPlace(id): Place \| null` (with its reviews) | exists |
| | `createPlace(fields): Place` | add |
| | `toggleBookmark(placeId)` | **remove** in Phase 0; replaced by `savePlace` / `unsavePlace` |
| `collections.ts` | `getSavedPlaceIds(): string[]` | add (Phase 0) |
| | `savePlace(placeId)` / `unsavePlace(placeId)`. Unsaving also takes the place out of every collection. | add (Phase 0) |
| | `getAllSavedPlaces(): Place[]` | exists |
| | `getSavedPlaces(): Place[]`, the loose ones that aren't in a collection | exists |
| | `getCollections(): Collection[]` | exists |
| | `getCollection(id): Collection \| null`. Handles `ALL_SAVED_ID`. | exists |
| | `getSavedCollectionIds(placeId): string[]`, which collections hold this place (for the save sheet) | add |
| | `createCollection(name, parentId?)`, `renameCollection(id, name)`, `deleteCollection(id)` | add |
| | `addToCollection(collectionId, placeId)`. Also saves the place. | add |
| | `removeFromCollection(collectionId, placeId)`. The place stays saved. | add |
| `reviews.ts` (new) | `getReviewsByUser(userId): Review[]` | add |
| | `createReview(fields: UploadFields): Review`. Uploads the media, and creates the place first if `placeId` is missing. | add |
| `users.ts` | `getProfile(id): Profile \| null` | exists |
| | `updateProfile(changes)`, for the signed-in user only. Drop the `id` argument; nothing calls it yet. | change |
| | `getSuggestedFriends(userId)` | **move** to `friends.ts` as `getSuggestedFriends()` |
| `friends.ts` (new) | `getFriends(userId): Profile[]` | add |
| | `getFriendRequests(): Profile[]`, requests sent to me that I haven't answered | add |
| | `sendFriendRequest(userId)`, `acceptFriendRequest(userId)` | add |
| | `removeFriend(userId)`. Also declines or cancels a request. | add |
| | `getSuggestedFriends(): Profile[]` | move here |
| `mock-backend.ts` | `getMockUserId()` / `setMockUserId(id)`, which demo user is signed in (starts as `'u1'`) | add (Phase 0) |
| `media.ts` (new, Phase 2) | `uploadMedia(localUri): string` (the storage path), `getMediaUrl(path): string` | add |

### Hooks

| File | Hook | Wraps | Used by |
| --- | --- | --- | --- |
| `use-session.tsx` | `SessionProvider`, `useSession()` returns `{ user, isLoading, signIn, signUp, signInAsMockUser, signOut }` | auth | root layout, Login, Create account, Profile |
| `use-places.ts` | `usePlaces(filters)` | `getPlaces` | Feed, Map, Upload suggestions |
| | `usePlace(id)` | `getPlace` | Place details |
| | `useCreatePlace()` | `createPlace` | Upload |
| `use-saves.ts` | `useSavedPlaceIds()`, `useIsSaved(placeId)` | `getSavedPlaceIds` | every `BookmarkButton` |
| | `useToggleSave()` | `savePlace` / `unsavePlace` | every `BookmarkButton` |
| | `useAllSavedPlaces()`, `useLooseSavedPlaces()` | `getAllSavedPlaces`, `getSavedPlaces` | Saved |
| `use-collections.ts` | `useCollections()`, `useCollection(id)` | `getCollections`, `getCollection` | Saved, Collection, save sheet |
| | `useCollectionsContaining(placeId)` | `getSavedCollectionIds` | save sheet |
| | `useCreateCollection()`, `useRenameCollection()`, `useDeleteCollection()` | | Saved, save sheet |
| | `useAddToCollection()`, `useRemoveFromCollection()` | | save sheet, Collection |
| `use-reviews.ts` | `useReviewsByUser(userId)` | `getReviewsByUser` | Profile |
| | `useCreateReview()` | `createReview` | Upload |
| `use-profiles.ts` | `useProfile(id)`, `useUpdateProfile()` | `getProfile`, `updateProfile` | Profile, Edit profile |
| `use-friends.ts` | `useFriends(userId)`, `useFriendRequests()`, `useSuggestedFriends()` | `friends.ts` | Profile |
| | `useSendFriendRequest()`, `useAcceptFriendRequest()`, `useRemoveFriend()` | `friends.ts` | Profile, `FriendSuggestion` |

### Mutations and what they refresh

| Mutation hook | Updates the cache first? | Then invalidates |
| --- | --- | --- |
| `useToggleSave` | yes, `saves.ids` | `saves.all`, `collections.all` |
| `useAddToCollection`, `useRemoveFromCollection` | optional, `collections.containing(placeId)` | `collections.all`, `saves.all` |
| `useCreateCollection`, `useRenameCollection` | no | `collections.all` |
| `useDeleteCollection` | no | `collections.all`, `saves.all` (its places become loose) |
| `useCreateReview` | no | `reviews.all`, `places.all` (ratings and the newest review change) |
| `useCreatePlace` | no | `places.all` |
| `useUpdateProfile` | no | `profiles.detail(id)` |
| `useSendFriendRequest`, `useAcceptFriendRequest`, `useRemoveFriend` | no | `friends.all`, `places.all` (friends' ratings change) |

## Type changes

| Type | Change | When |
| --- | --- | --- |
| `Place` | Remove `bookmark` and `addToList`. Use `useIsSaved(place.id)` instead. | Phase 0 |
| `Place` | Make `proximity` optional. It depends on where the phone is, so it can't come from the database. Only show the distance when it's set. | Phase 2 |
| `Place` | Keep `reviews?`. `getPlace` fills in all of them, and `getPlaces` can fill in just the newest one for the Feed card. | — |
| `Review` | Add `authorId`. Keep `profileName` as the username to show; the service fills it in from the author's profile. | Phase 1 (Profile reviews need it) |
| `Profile` | Remove `friendIds` and `postIds`. Use `useFriends(id)` and `useReviewsByUser(id)`. Mock services can keep their own lists inside the service. | Phase 1 (Profile) |
| `Collection` | No change. Services build `places` and `subCollections` from the database. | — |
| `src/types/database.ts` | Generated from the database in Phase 2. Never edit it by hand. | Phase 2 |

## Phase 0: Foundation

**One person, one PR, before Phase 1.** Everyone else keeps building UI in the meantime.

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

- [ ] React Query installed and provided in the root layout
- [ ] `src/lib/query-client.ts` and `src/lib/query-keys.ts`
- [ ] Mock current user in `mock-backend.ts`
- [ ] Mock saves in `collections.ts`; `Place.bookmark`, `addToList` and `toggleBookmark` removed
- [ ] `src/hooks/use-saves.ts`, used by Feed and Place details

## Phase 1: Connect screens to hooks (mock data)

Each page's owner does their own page, all at the same time. Add the hooks and mock service functions your page needs (see [Contracts](#contracts)). If two pages need the same hook, whoever gets there first writes it.

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

The mock session follows [01-login.md](pages/01-login.md). `signInAsMockUser(id)` calls `setMockUserId(id)` and then `queryClient.clear()`. `signIn` finds a mock user and accepts any password.

- [ ] Session, login gate and demo users
- [ ] Feed
- [ ] Map
- [ ] Place details
- [ ] Saved
- [ ] Collection
- [ ] Save sheet
- [ ] Profile (with `Review.authorId`; `Profile.friendIds` and `postIds` removed)
- [ ] Edit profile
- [ ] Upload

## Phase 2: Supabase

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

   Paste [supabase-schema.sql](supabase-schema.sql) into the new file in `supabase/migrations/`, then run `npx supabase db push`.
5. Write `supabase/seed.sql` with the mock places from `src/services/places.ts`, and run it once in the dashboard's SQL editor. Create the demo users by signing up in the app.
6. `npx supabase gen types --lang=typescript --linked > src/types/database.ts`
7. Create a **public** storage bucket named `media` (see [Media](#media)).

### 2b. Auth (Login owner)

Change `SessionProvider` to use Supabase Auth:

- On start, read `supabase.auth.getSession()`. After that, keep the user up to date with `supabase.auth.onAuthStateChange`.
- `signIn(email, password)` calls `signInWithPassword`. `signUp` calls `supabase.auth.signUp({ email, password, options: { data: { username, name } } })`, and a database trigger creates the profile from `username` and `name`.
- `signOut()` calls `supabase.auth.signOut()` and then `queryClient.clear()`.
- Supabase signs in with **email**, so the Login form asks for email instead of username (see [Open decisions](#open-decisions)).
- Only show the demo user buttons in development builds (`__DEV__`).

### 2c. Move services to Supabase (one PR per file, any order after 2a)

Only the insides of each function change. Convert database rows (`snake_case`) into the app's types (`camelCase`) inside the service, so screens never change.

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

- [ ] 2a. Project, client, CLI, first migration, seed, generated types, storage bucket
- [ ] 2b. Session uses Supabase Auth
- [ ] `places.ts`
- [ ] `collections.ts`
- [ ] `reviews.ts` and `media.ts`
- [ ] `users.ts`
- [ ] `friends.ts`
- [ ] `mock-backend.ts` deleted (nothing imports it any more)

### The schema

The full SQL, tested, is in [supabase-schema.sql](supabase-schema.sql).

| Table | What a row means |
| --- | --- |
| `profiles` | One per user (`id` is the same as the Supabase Auth user id). Created automatically on sign-up. |
| `places` | A place anyone can see. |
| `reviews` | One person's review of one place, rated 1 to 5. |
| `review_media` | A photo or video on a review. Stores its path in the `media` bucket. |
| `saves` | The bookmark. A place is saved if this row exists. |
| `collections` | A user's collection. `parent_id` puts one inside another ("France" inside "Europe Trip"). |
| `collection_places` | A place in a collection. |
| `friendships` | A friend request. `status = 'accepted'` means they're friends. Only one row per pair. |

Rules the database enforces, whatever the app sends:

- Putting a place in a collection also saves it.
- Unsaving a place takes it out of all of that user's collections.
- Signing up creates the profile.
- Ratings are 1 to 5, you can't friend yourself, and there's only one friendship per pair.

Values the database calculates instead of storing, so they're never out of date:

- **`average_rating`** and **`friends_rating`** are computed columns. Ask for them by name in `.select(...)`.
- **`suggested_friends()`** is a function that replaces the mock scoring. Call it with `supabase.rpc('suggested_friends')`.
- **"All saved"** is the `saves` table. **Loose saves** are saves that aren't in any of your collections.
- **`proximity`** and **`directions`** are worked out in the app.

Who can do what (row level security):

| Table | Read | Write |
| --- | --- | --- |
| `profiles`, `places`, `reviews`, `review_media` | anyone signed in | only your own (anyone signed in can add a place) |
| `saves`, `collections`, `collection_places` | only your own | only your own |
| `friendships` | the two people involved; accepted ones are visible to everyone | send as yourself; only the person asked can accept; either person can remove |

### Media

Store photos in the `media` bucket at `<user id>/<file name>`. Store only that path in the database, never the full URL. To upload, read the picked file as bytes and pass it to `supabase.storage.from('media').upload(path, bytes, { contentType })`. Supabase's [Expo user management tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) shows the whole flow, using `fetch(uri).then((res) => res.arrayBuffer())`. To show a photo, use `supabase.storage.from('media').getPublicUrl(path)`.

Then add a storage policy so people can only upload into their own folder (not tested locally, unlike the rest of the schema):

```sql
create policy "media: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

### Changing the schema later

- Make a new migration for each change (`npx supabase migration new <what-changed>`). **Never edit a migration that's already been pushed.**
- After the PR is merged, whoever merged it runs `npx supabase db push`, then regenerates `src/types/database.ts` and commits it.
- Every new table needs `enable row level security` and policies in the same migration. A table without policies can't be read or written from the app. A table with RLS turned off can be read and written by anyone.

## Phase 3: Later

- **Auto-sort.** `profiles.auto_sort_saves` already exists. Add `match_country`, `match_city` and `match_place_type` to `collections`, plus an `after insert` trigger on `saves` that adds the place to matching collections. First answer the open questions in the `collections.ts` note.
- **Distance.** Get the phone's location with `expo-location`, and fill in `proximity` in the service or hook.
- **Live friend requests**, using Supabase Realtime on `friendships`.
- **AI summaries**, written by an Edge Function when reviews change, and stored in `places.ai_summary`.
- **Search debounce.** Wait about 300 ms after typing stops before the search text goes into the query key, so it's not one request per keystroke.

## Open decisions

Each one has a default, so work isn't blocked. Change the default here if the team decides otherwise.

| Question | Default |
| --- | --- |
| Sign in with email or username? | **Email.** Supabase Auth signs in by email, and looking up an email from a username would let anyone find people's emails. The username stays as the display handle. |
| Friend requests, or follow without approval? | **Requests.** The schema supports them. Follows would be a simpler `follows` table. |
| Does a bookmark tap toggle, or open the save sheet? | **Open the sheet**, as planned in [05](pages/05-saved-collections.md). Until the sheet exists, it toggles. |
| Can friends see your collections? | **No**, they're private. Loosen the `collections` read policy later if needed. |
| How deep can collections nest? | **One level.** `createCollection` refuses a parent that already has a parent. |
| Who can read reviews? | **Anyone signed in.** |
