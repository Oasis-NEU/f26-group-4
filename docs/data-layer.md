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
                 Each tab is a (name) folder with its own stack inside it, so opening a
                 place or a collection keeps the tab bar. Screens that should cover the
                 WHOLE screen (Upload, Settings, Edit profile, Login) stay at the top
                 level. Screens every tab can open (place, collection, someone's profile,
                 New collection) live in (tabs)/(profile,map,explore,saved)/.
src/components/  Same rule as screens: hooks, not services.
src/hooks/       One file per kind of data (use-saves.ts, use-places.ts, ...): useQuery / useMutation around services.
src/lib/         query-client.ts, query-keys.ts and supabase.ts. Also plain functions with no
                 backend for collections and Explore: collection-rules.ts, collection-tree.ts,
                 regions.ts, countries.ts and suggestions.ts.
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
| `places.ts` | `getPlaces(filters): Place[]` | `search_places()`, with ratings, city and reviews. `filters.rules` (an Explore tile) is matched in the app, after the search |
| | `getPlace(id): Place \| null` | with all its reviews |
| | `getPlaceTypes()`, `getSuitedForTags(): string[]` | the filter lists, from the database |
| | `getPlacesByIds(ids): Place[]` | several places in one request, e.g. the ones a profile reviewed |
| `collections.ts` | `getSavedPlaceIds(): string[]` | |
| | `savePlace(placeId)` / `unsavePlace(placeId)` | a new save also goes into every auto add collection it matches ([Collections and auto add](#collections-and-auto-add)); unsaving also takes the place out of every collection (a database rule) |
| | `getAllSavedPlaces()`, `getSavedPlaces(): Place[]` | every save; the loose ones |
| | `getCollections()`, `getCollectionsForProfile(ownerId): Collection[]` | yours; someone's, without their private ones |
| | `getCollection(id): Collection \| null` | handles `ALL_SAVED_ID`; with the sub-collections directly inside it |
| | `removeFromCollection(collectionId, placeId)` | the place stays saved. On an auto add collection it goes into `collection_exclusions`, so auto add doesn't put it straight back |
| | `createCollection(fields: NewCollectionFields): string` | the name, an optional `parentId`, `isPrivate` (left out, the person's setting decides), the auto add `rules` and `autoAdd`, and `placeIds` to put in straight away. Gives back the new id |
| | `getSavedCollectionIds(placeId)`, `renameCollection`, `deleteCollection`, `addToCollection` | **add** for the save sheet |
| `posts.ts` | `createPost(fields: UploadFields): SavedPost` | uploads the photos, then `create_review()`, which adds the city and place if they're new |
| `reviews.ts` | `getReviewsByAuthor(authorId): AuthoredReview[]` | |
| | `getLikedReviewIds(): string[]` | every review the signed-in user liked |
| | `likeReview(reviewId)`, `unlikeReview(reviewId)` | |
| | `getReviewComments(reviewId)`, `addReviewComment(reviewId, text)` | Replies to one review |
| `users.ts` | `getProfile(id): Profile \| null` | yours has your full `status`; anyone's has the trimmed `visibleStatus` |
| | `getProfilesByIds(ids): Profile[]` | several people in one request, in the order given (followers, blocked accounts) |
| | `updateProfile(changes)` | the signed-in user only; routes each field to its table |
| | `isUsernameAvailable(username)` | works signed out |
| | `getSuggestedFriends(): SuggestedFriend[]` | with each reason ("Also in Lisbon", "3 mutuals") |
| | `getFriendUsernames(): string[]` | the people you follow |
| `follows.ts` | `getFollowerIds(userId)`, `getFollowingIds(userId)`, `isFollowing(userId)` | |
| | `followUser(userId): 'following' \| 'requested'` | a friends-only account gets a request |
| | `unfollowUser(userId)`, `setNotifyPrefs(userId, prefs)` | |
| | `getFollowStatus(userId): FollowStatus` | signed-in user's state ('none'/'following'/'requested') + notify prefs toward one person, for user/[id] |
| | `getFollowRequests()`, `acceptFollowRequest(fromId)`, `declineFollowRequest(fromId)` | the 📥 inbox |
| `settings.ts` | `getSettings()`, `updateSettings(changes)` | put together from four tables |
| | `addCloseFriend(id)`, `removeCloseFriend(id)`, `blockUser(id)`, `unblockUser(id)` | |
| `interests.ts` | `getInterestsByIds(ids)`, `searchInterests(query)`, `getPopularInterests(limit)`, `suggestInterestsFromPosts()`, `addInterest(name)` | |
| `cities.ts` | `getCities(filters)`, `getCity(id)`, `getCityPlaces(id)` | the `city_stats` view. Nothing calls them since Explore merged into the feed; delete once the team has merged |
| `profile-cities.ts` | `getProfileCity(id)`, `searchProfileCities(query)`, `getCityIdByName(name, country)` | the `cities` table |
| | `addProfileCity(name, country)` | adds a row when the picker's search comes up empty; same `cities: add` RLS policy posting a review in a new city already uses |
| `destination-photos.ts` | `getDestinationPhotos(cityId): string[]` | the `destination-photo` Edge Function -- Pixabay, key held server-side only ([Dream trip cover](#dream-trip-cover)) |
| `media.ts` | `uploadMedia(localUri, folder)`, `getMediaUrl(path)`, `deleteMedia(paths)` | photos in the `media` bucket |
| `badges.ts` | `getBadgesForProfile(userId)`, `getUserBadges()`, `getUnseenBadges()`, `markBadgeSeen(badgeId)`, `checkBadges()` | `BADGE_DEFINITIONS` and the rules live here too ([Badges](#badges)) |
| `place-rows.ts` | `PLACE_SELECT`, `toPlace`, `toReview` | shared by the services that return places. Nothing per-user: "saved?" and "liked?" are their own queries (rule 6) |
| `mock-backend.ts` | `mockRequest(data)` | only `template-service.ts` uses it now |

Helpers that don't touch the backend live in `src/utils/`: `validatePost(fields)` (Upload's form check, in `validate-post.ts`) and `formatStatusText` / `trimStatusForLevel` (Edit profile's and Privacy's previews, in `status-text.ts`; the database trims everyone else's status).

### Hooks

Every hook that takes one id also accepts `undefined`, and waits until the id is set (`skipToken`). So a screen can call it before it knows the id.

| File | Hooks | Wraps | Used by |
| --- | --- | --- | --- |
| `use-session.tsx` | `SessionProvider`, `useSession()` returns `{ user, isLoading, signIn, signUp, signInAsDemoUser, signOut, deleteAccount }`; `useUserId()` | Supabase Auth | root layout, Login, Create account, Settings, Profile |
| `use-places.ts` | `usePlaces(filters)`, `usePlace(id)`, `usePlacesByIds(ids)` | `getPlaces`, `getPlace`, `getPlacesByIds` | Explore, Map, Place details, Profile |
| | `useSuggestions()`, the Explore tiles | `getPlaces({})`, then `buildSuggestions` from `src/lib/suggestions.ts` | `SuggestionStrip` |
| | `useFilterOptions()` returns `{ placeTypes, suitedFor }` | `getPlaceTypes`, `getSuitedForTags` | Explore, Map, Upload, New collection |
| `use-saves.ts` | `useSavedPlaceIds()`, `useIsSaved(placeId)`, `useToggleSave()` | `getSavedPlaceIds`, `savePlace` / `unsavePlace` | `PlaceCard`, Place details, Collection |
| | `useAllSavedPlaces()`, `useLooseSavedPlaces()` | `getAllSavedPlaces`, `getSavedPlaces` | Saved |
| `use-collections.ts` | `useCollections()`, `useCollectionsForProfile(ownerId)`, `useCollection(id)`, `useRemoveFromCollection()`; re-exports `ALL_SAVED_ID` | `getCollections`, `getCollectionsForProfile`, `getCollection`, `removeFromCollection` | Saved, Profile, Collection |
| | `useCreateCollection()`, `useCanAddSubCollection(id)`, `useRulesAbove(parentId)` | `createCollection`; the other two work out the nesting from `useCollections()` with `src/lib/collection-tree.ts` | New collection, Collection |
| | `useCollectionsContaining(placeId)`, `useRenameCollection()`, `useDeleteCollection()`, `useAddToCollection()` | **add** with the save sheet | |
| `use-reviews.ts` | `useReviewsByUser(userId)`, `useIsLiked(reviewId)`, `useToggleLike()` | `getReviewsByAuthor`, `getLikedReviewIds`, `likeReview` / `unlikeReview` | Profile, `PlaceCard` |
| | `useReviewComments(reviewId)`, `useAddReviewComment(reviewId)` | `getReviewComments`, `addReviewComment` | Comments modal |
| | `useCreatePost()` | `createPost` | Upload |
| `use-profiles.ts` | `useProfile(id)`, `useProfilesByIds(ids)`, `useUpdateProfile()` | `getProfile`, `getProfilesByIds`, `updateProfile` | Profile, Edit profile, Settings, connections/[id] |
| | `useCheckUsername()` returns `(username) => Promise<boolean>` | `isUsernameAvailable` | Create account, Edit profile |
| `use-follows.ts` | `useFollowerIds(userId)`, `useFollowingIds(userId)`, `useFollowRequests()`, `useSuggestedFriends()`, `useFriendUsernames()` | `follows.ts`, `getSuggestedFriends`, `getFriendUsernames` | Profile, Map, Privacy, Close friends, connections/[id] |
| | `useFollow()`, `useUnfollow()`, `useAcceptFollowRequest()`, `useDeclineFollowRequest()` | `followUser`, `unfollowUser`, `acceptFollowRequest`, `declineFollowRequest` | Profile |
| | `useFollowStatus(userId)`, `useSetNotifyPrefs()` | `getFollowStatus`, `setNotifyPrefs` | user/[id] |
| `use-settings.ts` | `useSettings()`, `useUpdateSettings()`, `useToggleCloseFriend()`, `useBlockUser()`, `useUnblockUser()` | `settings.ts` | Settings screens |
| `use-interests.ts` | `useInterestsByIds(ids)`, `usePopularInterests(limit, enabled?)`, `useSearchInterests(query)`, `useSuggestedInterests(enabled?)`, `useAddInterest()` | `interests.ts` | Profile, Edit profile |
| `use-cities.ts` | `useCities(filters)`, `useCity(id)`, `useCityPlaces(id)` | `cities.ts` | nothing now (they were for the Explore and City pages) |
| | `useProfileCity(id)`, `useCitySearch(query)`, `useAddProfileCity()` | `profile-cities.ts` | Profile, Edit profile; `useCitySearch('')` for Upload's and New collection's city pickers |
| | `useDestinationPhotos(id, enabled)` | `destination-photos.ts` | `EditCoverPanel`'s "Dream trip" option, `ProfileCover`'s Auto-mode photo |
| | `useCityIdByName(name, country)` | `profile-cities.ts` | `ProfileCover`, to resolve the status city's id (it has no id of its own) for the Auto-mode photo |
| `use-badges.ts` | `useBadgesForProfile(userId)`, `useUserBadges()`, `useUnseenBadges()`; re-exports `BADGE_DEFINITIONS` | `badges.ts` | Profile Badges tab, `BadgeCelebrationHost` |
| | `useCheckBadges()`, `useMarkBadgeSeen()` | `checkBadges`, `markBadgeSeen` | `BadgeCelebrationHost`; `checkBadges` is also called from `useCreatePost`, `useUpdateProfile`, `useCreateCollection` |

### Mutations and what they refresh

| Mutation hook | Changes the cache first? | Then invalidates |
| --- | --- | --- |
| `useToggleSave` | yes, `saves.ids` | `saves.all`, `collections.all` (unsaving uncollects) |
| `useToggleLike` | yes, `reviews.likedIds` | `reviews.likedIds` |
| `useAddReviewComment` | no | `reviews.all`, `places.all` |
| `useRemoveFromCollection` | no | `collections.all`, `saves.all` |
| `useCreateCollection` | no | `collections.all`, `saves.all` (places put in straight away stop being loose), `badges.all` (Curator) |
| `useCreatePost` | no | `places.all`, `cities.all`, `reviews.all`, `collections.all`, `saves.all`, `interests.suggested`, `badges.all` (most badges) |
| `useUpdateProfile` | no; stays pending until the fresh profile loads | `profiles.all`, `interests.all`, `follows.suggestions`, `badges.all` when goals changed (Goal Getter) |
| `useFollow`, `useUnfollow`, `useAcceptFollowRequest`, `useDeclineFollowRequest` | no | `follows.all`, `profiles.all`, `places.all` (friends' ratings change) |
| `useSetNotifyPrefs` | no | `follows.status(userId)` |
| `useUpdateSettings` | yes, `settings.all` | `settings.all`, `follows.all` (friends-only off accepts requests), `profiles.all` |
| `useToggleCloseFriend` | yes, `settings.all` | `settings.all` |
| `useUnblockUser` | yes, `settings.all` | `settings.all`, `follows.all`, `profiles.all` |
| `useBlockUser` | no | `settings.all`, `follows.all` (blocking ends follows), `profiles.all` |
| `useAddInterest` | no | `interests.all` |
| `useAddProfileCity` | no | `cities.all` |
| `useCheckBadges`, `useMarkBadgeSeen` | no | `badges.all` |
| save sheet: `useAddToCollection`, `useRenameCollection`, `useDeleteCollection` | **add** | `collections.all`, and `saves.all` for add and delete |

## Collections and auto add

From Ruby's `collections-and-explore` branch, moved onto Supabase when it was merged.

- **Rules.** A collection can have `rules` (`CollectionRules` in `src/types/collection.ts`: regions, countries, cities, place types and "suited for" tags). Inside one group any match is enough; every group that's filled in has to match: "Bars in Japan". `matchesRules()` in `src/lib/collection-rules.ts` decides, and `regions.ts` knows which countries are in "Europe".
- **Auto add.** With `auto_add` on, `savePlace()` puts a newly saved place into every matching collection. It runs in the app, not a trigger, so the New collection screen's "3 places already match" preview uses the same code. A failure there is logged and leaves the save in place.
- **Nesting.** Three deep (Europe Trip > France > Paris), `MAX_COLLECTION_DEPTH` in `src/lib/collection-tree.ts`, and the database refuses a fourth level. A sub-collection is narrowed by the ones above it: a place has to match Europe AND France AND Paris.
- **Taking a place out by hand** adds a row to `collection_exclusions` (only the owner can see it), so auto add skips that place. Putting it back in by hand clears the row (a database rule).
- **The database half** is the `collection_rules` migration: the `rules` and `auto_add` columns, the exclusions table, and the three-level nesting check. Until it's pushed, plain collections still work (reads ask for `*`, and only a collection with rules writes the new columns). Making one with rules, or a third level, fails with the database's error. After pushing, regenerate `src/types/database.ts` and switch the `untypedSupabase` queries in `collections.ts` back to `supabase`.

## Badges

From the wireframe at `https://claude.ai/artifact/88movwt1s8KE6VCvvwvUrx` (badge list + the "you earned a badge" pop-up). First batch -- the starter badges, plus the rest that needed only data already in the app. Cut for now: Round Trip (the database only allows one review per place per person), four of the original "Taste" badges that named place types the app doesn't have (bakery, hike, viewpoint, street food -- replaced with Full Course/restaurant, Thrill Seeker/excursion, Game On/sport, Garden Variety/garden, which do exist), the combo/meta badges (Hot Streak, Whirlwind Tour, Grand Tour, Full Passport), Trailblazer, Tour Guide, Same Wavelength, Dreamer, Continental, and Plus One -- each needs either a cross-user query, a concept the app doesn't track yet (save attribution, continents, "trip taken"), or a whole invite feature (Plus One).

- **Rules live in code, not the database.** `BADGE_DEFINITIONS` in `src/services/badges.ts`: each has a `levelReached(ctx)` that reads a `BadgeContext` (your reviews, home city, travel goal progress, collection count) and returns how many of its `levels` you've cleared, 0 if none. `public.user_badges` only stores which badge/level you've reached, when, and whether its pop-up has shown (`seen_at`) -- never the rule.
- **`checkBadges()`** re-runs every rule and upserts anything newly earned or levelled up, with `seen_at` cleared so levelling up pops up again. Called from `onSettled` on the mutations that can earn something (`useCreatePost`, `useUpdateProfile`, `useCreateCollection`), and once whenever the app opens or comes back to the foreground (`BadgeCelebrationHost`) -- the foreground check is also the only way **Crowd Favorite** is ever noticed, since it's earned by someone else liking your posts, not by anything you do.
- **The pop-up** (`BadgeCelebrationHost`, mounted once in the root layout next to the tab navigator, not inside Profile) shows `useUnseenBadges()` one at a time, oldest first; dismissing one marks it seen and the next one (if any) takes its place. Secret badges show "???" until a short reveal delay. Respects `AccessibilityInfo.isReduceMotionEnabled()` -- no confetti or stamp animation when it's on.
- **`BadgeDetailCard`** is the shared modal body behind both that pop-up and tapping any badge on the grid (`EarnedBadges` in `profile-badges.tsx`, no confetti there): an earned badge reopens the same card with Share available again, for whoever missed it the first time; an unearned, non-secret badge opens the same card greyed out with its description as a hint; an unearned secret badge isn't tappable at all, so it stays a mystery.
- **Badges are public**, same as reviews: anyone can read anyone's `user_badges` rows, except people the badge's owner has blocked (`user_badges: read, except by people who blocked you`, matching the reviews policy). Only the badge's owner can ever write it. On your own profile, the Badges tab grid (`EarnedBadges` in `profile-badges.tsx`) also shows what you haven't earned yet, greyed out, as a checklist; on someone else's it only shows what they've actually earned -- a wall of "???" for a stranger's unearned badges isn't useful the way it is for your own.
- **No backfill job yet.** `backfilled` exists on `user_badges` for the wireframe's launch-day idea (compute everyone's badges once, retroactively, with one combined screen instead of a flood of pop-ups) but nothing sets it; every badge from here on is earned live.
- **Starter badges sit alongside the Profile Checklist, not instead of it.** `ProfileChecklist` (the "Complete your profile" card) stays exactly as it was -- still the reminder of what's left, still hides itself once you've done all four. Passport Photo, First Stamp and Travel Buddies are each one of those same four steps, as their own badge/pop-up moment; Cleared for Takeoff is finishing all four.

## Dream trip cover

Two distinct things, both built on `supabase/functions/destination-photo` (Pixabay, key held server-side as the `PIXABAY_API_KEY` secret -- the app only ever gets back photo URLs, and the function only accepts a real `cityId` already in the app, so it can't be used as an open proxy onto Pixabay):

1. **The "Dream trip" option in `EditCoverPanel`** (alongside Auto/My own/No cover) -- deliberately picking a specific photo as your permanent cover. This becomes a normal `custom` cover underneath, same as uploading your own; `Profile.coverIsDreamTrip` (a real column, not local state) is the only way to tell the two apart, for the radio dot in `EditCoverPanel` and for the next point. `useDestinationPhotos` only fetches once this row is actually opened (`enabled`), not eagerly.
2. **Auto mode itself showing a real photo**, in `ProfileCover` -- for whichever city it would otherwise just print as text (your current traveling/planning city, or your dream trip when home). This is never saved and never converts away from `coverMode: 'auto'`: it re-resolves every time the featured city changes, so it keeps tracking wherever the person actually is (or their dream trip, if they go home). The photo is picked deterministically from the set (`pickPhoto`, a stable hash, not `Math.random()` -- the React Compiler won't allow an impure call during render, and a stable pick is better here anyway: it doesn't flicker between re-renders or look different to two people viewing the same profile). The status city never carries its own id (`TravelStatus` only ever has a name), so `useCityIdByName` resolves one by name + country first; the dream trip city's id is already known and passed straight through.

**Changing your dream trip city in Edit profile** (`handleDreamTripSelect`) only has to handle the *deliberate* case: if your cover is currently a dream-trip `custom` photo (`coverIsDreamTrip`), it's now stale (a photo of the old city), so this takes you straight into the cover picker to choose a fresh one, rather than silently swapping a photo you deliberately chose. It does nothing when the cover is Auto (point 2 already keeps that current on its own) or an uploaded photo (never touched automatically).

## Type changes

| Type | Change | When |
| --- | --- | --- |
| `Place` | Remove `bookmark` and `addToList`. Use `useIsSaved(place.id)` instead. | Done |
| `Place` | Make `proximity` optional. It depends on where the phone is, so it can't come from the database. Only show the distance when it's set. | Done |
| `Place` | Keep `reviews?`. `getPlace` fills in all of them, and `getPlaces` can fill in just the newest one for the Feed card. | — |
| `Review` | Add `authorId`. Keep `profileName` as the username to show; the service fills it in from the author's profile. | Done |
| `Review` | Remove `likedByMe`. Use `useIsLiked(review.id)` instead. | Done |
| `Profile` | Remove `friendIds` and `postIds`. Use `useFollowerIds(id)`, `useFollowingIds(id)` and `useReviewsByUser(id)`. | Done |
| `Collection` | Add `parentId`, `rules` and `autoAdd`. Services build `places` and `subCollections` from the database. | Done |
| `StatusDetail` | Removed. Replaced by `StatusSharing` (`{ country, city, dates }`, three independent booleans instead of one hidden/country/city/full ladder -- `dates` only has an effect when `country` is also on). `trimStatusForLevel` is now `trimStatus(status, sharing)`. `settings` and `profile_locations` each split their one sharing column into six booleans (`..._country`/`..._city`/`..._dates` per audience); the `SharingToggles` component (three checkboxes) replaces the old single-select pills in Privacy and Edit profile's status panel. | Done |
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
| Feed | `(tabs)/(explore)/index.tsx` | `usePlaces(filters)` | the `ignore` `useEffect` and `load()` |
| Map | `(tabs)/(map)/map.tsx` | `usePlaces(filters)` | the `ignore` `useEffect`. Keep the camera logic in a `useEffect` that runs when the places change. |
| Place details | `(tabs)/(profile,map,explore,saved)/place/[id].tsx` | `usePlace(id)` | the `useEffect` |
| Saved | `(tabs)/(saved)/saved.tsx` | `useCollections()`, `useLooseSavedPlaces()`, `useAllSavedPlaces()` | three `.then` calls; the "reload on focus" TODO |
| Collection | `(tabs)/(profile,map,explore,saved)/collection/[id].tsx` | `useCollection(id)`, `useRemoveFromCollection()` | the `useFocusEffect` TODO |
| Save sheet (new) | `save-to-collection.tsx` | `useCollections()`, `useCollectionsContaining(placeId)`, `useAddToCollection()`, `useRemoveFromCollection()`, `useCreateCollection()` | Bookmark taps open this instead of toggling directly. Plan: [05](pages/05-saved-collections.md) |
| Profile | `(tabs)/(profile)/profile.tsx` | `useSession()`, `useProfile(id)`, `useReviewsByUser(id)`, `useFriends(id)`, `useSuggestedFriends()` | `CURRENT_USER_ID`; the `useFocusEffect` fetch; the reviews TODO |
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

   Done differently: the schema is three migrations in `supabase/migrations/` (core, people, reactions), plus `drop_listings`, which removed an unused, unprotected `listings` table the shared project started with. They were pushed to the shared project on Nov 8, 2026 with `npx supabase db push --remote` (in CLI v3, plain `db push` targets the local stack).
5. Done differently: the demo data is one file per system in `supabase/seed/`, and `npm run demo:reset` creates the demo accounts and loads it (backend-plan.md, "Demo data").
6. `npx supabase gen types --schema public > src/types/database.ts`, from the local stack. **Not with `--remote`:** the shared project's generator leaves computed fields like `average_rating` out of the row types and makes the `city_stats` columns nullable, so the services stop typechecking. (CLI v3 replaced `--linked` and `--lang`.)
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
- Regenerate `src/types/database.ts` from the local stack in the same PR as the migration (`npx supabase gen types --schema public > src/types/database.ts`, never with `--remote`; see 2a step 6).
- After the PR is merged, the tech lead runs `npx supabase db push --remote`, then `npx supabase db advisors --remote`.
- Every new table needs `enable row level security`, policies and grants in the same migration ([backend-plan.md, "Writing migrations"](backend-plan.md#writing-migrations)). A table without policies or grants can't be read or written from the app. A table with RLS turned off can be read and written by anyone signed in.
- Add a check to `supabase/tests/` for every new privacy rule, and run `npx supabase test db`.

## Phase 3: Later

- **Auto add in the database.** Auto add is built ([Collections and auto add](#collections-and-auto-add)), with the matching in the app. An `after insert` trigger on `saves` would also catch saves that don't go through `savePlace()`, and do it in one transaction. It needs the regions in SQL first: a place only has a city and a country, so either expand a region into its countries when the rule is saved, or move `src/lib/regions.ts` into a `country_regions` table.
- **Renaming and deleting collections**, and editing a collection's rules. You can make one, and that's it.
- **One list of tags.** See the open decision about interests and "suited for".
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
| How deep can collections nest? | **Three levels**, so Europe > France > Paris works. `MAX_COLLECTION_DEPTH` in `src/lib/collection-tree.ts`, and the database refuses a fourth (the `collection_rules` migration). |
| Does a sub-collection inherit its parent's rules? | **No, it's narrowed by them.** Europe > France > Paris means a place has to match all three. Prefilling the parent's rules was tried first and went wrong: "Paris" started as "anywhere in France", and because everything about WHERE is an either/or, adding Paris read as "France or Paris" and the collection swallowed every French place. |
| A saved place matches two auto add collections. Which one? | **Both.** |
| Is auto add a per-user setting or a per-collection one? | **Per collection** (`collections.auto_add`), because the rules live on the collection. There's no per-person off switch yet. |
| Does turning auto add on backfill places you already saved? | **Only if you ask.** The New collection screen counts the matches and offers to add them. |
| A sub-collection matches. Does the parent get the place too? | **No.** A parent already shows everything inside its children. |
| Are a place's "best suited for" tags and a profile's interests the same list? | **Yes, in the app; not yet in the database.** They are the same words -- `adventure` and `photography` are rows in BOTH `interests` and `suited_for_tags`, so of 22 rows only 20 are distinct tags. `src/services/tags.ts` reads both and presents one vocabulary, and new tags go to `interests` (the growable one); that works because `places.suited_for` is a plain `text[]` with no foreign key. **Still to do: a migration joining the two tables**, which would also fix the slugs disagreeing (`remote work` with a space vs `street-food` with a dash). Place types stay separate -- what a place IS is a different question, and `places.place_type` is a real foreign key. |
| Can people add a new place type or "suited for" tag? | **Not yet.** Upload and New collection pick from `place_types` and `suited_for_tags`, which only change with a migration, and `create_review()` drops tags it doesn't know. |
| Where does the list of cities come from? | **The `cities` table**, through `useCitySearch`, the same list Edit profile uses. People can type any other city, and `create_review()` adds it. Google Places Autocomplete could replace it later. |
| Can someone pick a country the app hasn't seen? | **Yes.** `src/lib/countries.ts` has all of them with their two-letter codes, and the flag is worked out from the code instead of a lookup list. |
| Who can read reviews? | **Anyone signed in.** |
