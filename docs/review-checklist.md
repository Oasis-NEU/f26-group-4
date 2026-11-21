# What to review

Everything added or changed in the collections work, in the order worth reading
it. This file is a working note for Ruby, not part of the app — delete it once
it's all been read.

**Start at the top.** The first four files are the ideas; everything after
is those ideas being used. If you only read four things, read those.

- [ ] = not read yet. Tick as you go.

---

## 0. What changed when this was merged onto master (Nov 15)

This branch was built on the mock data. Master had moved to Supabase and
React Query in the meantime, so the merge moved the feature across. The ideas
are the same; where things live changed. The rest of this file still describes
the branch as it was.

- [ ] **Services talk to Supabase, and screens use hooks.** `createCollection`,
  auto add and exclusions are in `src/services/collections.ts`. Screens call
  `useCreateCollection()`, `useCanAddSubCollection(id)` and `useRulesAbove(parentId)`
  from `src/hooks/use-collections.ts`, and the tiles come from `useSuggestions()`
  in `src/hooks/use-places.ts`.
- [ ] **The nesting helpers moved** to `src/lib/collection-tree.ts`
  (`MAX_COLLECTION_DEPTH`, `rulesAbove`, `describeLimits`, `matchesWithAncestors`),
  and `src/services/suggestions.ts` is now `src/lib/suggestions.ts`
  (`buildSuggestions(places)`), since neither talks to the backend.
- [ ] **Auto add is wired up.** `savePlace()` puts a new save into every matching
  auto add collection, using `matchesRules()`.
- [ ] **The database half** is `supabase/migrations/20261115212311_collection_rules.sql`:
  `rules` and `auto_add` on `collections`, three-level nesting, and a
  `collection_exclusions` table instead of `excludedPlaceIds`. Other people can
  read your public collections, so the places you took out are in a table only
  you can see.
- [ ] **Tags stayed two lists.** The database has `interests` for profiles and
  `place_types` / `suited_for_tags` for places, so `searchTags()` / `addTag()`
  and `kind` weren't brought over. Upload and New collection pick from the
  database's lists, and they can't add new ones yet. `create_review()` only
  accepts tags it knows.
- [ ] **Cities come from the `cities` table** (`useCitySearch`), not
  `searchCityNames()`. Any city can still be typed.
- [ ] **`SearchTagField` takes `options`** (every choice) and filters them
  itself, instead of an async `search` function.
- [ ] **Someone's profile (`user/[id]`) moved into the shared tab folder** too.
  Master added it after this branch.
- [ ] **One `new-collection.tsx`.** The branch had a second copy in a
  `(profile,map,feed,saved,explore)` folder, which made two files for the same
  route, so that copy was dropped.
- [ ] **Removing a place from a collection works now** (master had built it),
  and the private switch starts from the "new collections are private" setting.

---

## 1. The ideas — read these first (~20 min)

### [ ] `src/types/collection.ts`
The shape of a collection. **This is the file to understand first** — every
other file is downstream of it. New fields: `rules` (what belongs in here),
`autoAdd` (fill it automatically), `parentId`, `excludedPlaceIds` (places you
pulled out by hand).

### [ ] `src/lib/collection-rules.ts`
**The one bit of real logic in the whole feature.** Decides whether a place
belongs in a collection. The comment at the top explains the matching rule:
three groups (where / kind of place / suited for), AND between groups, OR
inside one. "Bars in Japan" means both; "Europe or Japan" means either.

Also `describeRules()`, which turns rules back into the sentence shown on
screen, and `describeRulesAsLimit()` for the "only places in France" line.

### [ ] `src/lib/regions.ts`
A plain lookup table: region → countries. Needed because a `Place` only knows
its city and country, so nothing says "Europe". France is listed under both
"Europe" and "Western Europe" on purpose, which is what makes a "Europe Trip"
collection catch a place in Chamonix. **Skim the list, read the functions.**

### [ ] `src/lib/countries.ts`
Every country with its two-letter code. **Skim the list.** The part worth
reading is `countryFlag()` at the bottom: a flag emoji is worked out from the
two letters with a formula, which is why there's no list of 195 flags. This
replaced the hand-typed list of 8 in `country-flags.ts` and closed the TODO
that was already sitting there.

---

## 2. The services — the data side (~20 min)

### [ ] `src/services/collections.ts` — **the biggest change here**
Read it in two halves.

The top half is mostly as it was, plus `copyCollection()`. That one matters:
every getter now returns a **copy**. Returning the stored object is what caused
a bug where adding a sub-collection showed nothing until you reloaded — React
compared the old and new value, saw the same object, and skipped the re-render.

The bottom half is new, under "Making a collection, and auto add":
- `MAX_COLLECTION_DEPTH` — three levels, so Europe > France > Paris works
- `createCollection()`, `getParentOptions()`, `canAddSubCollection()`
- `getAncestorRules()` / `describeAncestorLimits()` — **read the comment on
  these.** A sub-collection is *narrowed by* its parents, not prefilled with
  their rules. The comment explains the bug that forced the change.
- `applyAutoAdd()` — **not wired up yet.** `savePlace()` has to call it, and
  `savePlace()` doesn't exist until Phase 0 of `docs/data-layer.md`.

### [ ] `src/services/interests.ts`
Tags are now **one shared list** used two ways: profile interests, and a
place's "best suited for". A new `kind` field separates those from place types
(cafe, museum). New: `searchTags()` and `addTag()`. The existing functions were
changed only to filter to `kind === 'interest'`, so Profile behaves as before.

### [ ] `src/services/cities.ts`
Only one addition at the bottom: `searchCityNames()`. **Read the comment** —
it says the real answer is Google Places Autocomplete and what to replace.

### [ ] `src/types/interest.ts`
Small. `kind`, and a `Tag` alias for the better name.

### [ ] `src/services/profile-cities.ts` — one line
`mockProfileCities` is now exported so `cities.ts` can suggest those names too.

### [ ] `src/services/places.ts` — comment only
A note saying `PLACE_TYPES` / `SUITED_FOR` are for filter bars, and forms
should use `searchTags()` instead. No code changed.

---

## 3. The screens (~20 min)

### [ ] `src/app/(tabs)/(profile,map,explore,saved)/new-collection.tsx`
The New collection screen. Long, but it's mostly form fields. The parts worth
reading: the comment at the top on why there's no "Inside" picker, and
`leaveScreen()` on why it isn't just `router.back()`.

### [ ] `src/components/search-tag-field.tsx`
The type-to-find picker used for countries, cities and tags. **Read the
comment on `closeSoon()`** — closing the list when you tap away is fiddlier
than it looks, because tapping a result blurs the box first.

### [ ] `src/app/(tabs)/(profile,map,explore,saved)/collection/[id].tsx`
Sub-collections are tappable now, there's a `+` in the header, and the screen
always draws its own back arrow. The comment on `goBack()` explains why.

### [ ] `src/app/(tabs)/(saved)/saved.tsx`
The `+ New` pill, and `useFocusEffect` instead of `useEffect` so a new
collection shows up without restarting the app.

### [ ] `src/app/upload.tsx` — **not your file**
Changed with a block comment at the top explaining what and why. City, Country,
Place type and Suited for are now pickers instead of hardcoded five-item lists.
**There's a TODO in that comment for whoever builds the Post button** — new
tags aren't saved to the shared list until something calls `addTag()`.

---

## 4. Explore merged into the feed (~10 min)

Explore was a page of city tiles; tapping one opened a *third* screen listing
that city's places -- the same places the feed already showed. Now the tiles
are a row at the top of the feed and they filter it in place.

### [ ] `src/services/suggestions.ts`
**Read this one properly.** It builds the tiles -- "Hikes in France", "Food in
Japan" -- by pairing a kind of place (or a vibe) with a country that actually
has some, so a tile never leads to an empty feed.

Each tile is a set of `CollectionRules`, **the same type collections use**.
That's the idea worth taking from this file: a tile and a collection both
answer "which places does this stand for?", so they share one matching
function and one way of writing themselves out in words. "Hikes in France" is
`describeRules()` output, not a typed-in string.

**There's a TODO near the bottom** for personalising the order. It's written
out because it's the next real piece of work: a profile's interests and a
place's `suitedFor` tags are already the same list of tags, so they can be
compared directly.

### [ ] `src/components/suggestion-strip.tsx`
The row itself. Short.

### [ ] `src/app/(tabs)/(explore)/index.tsx`
The old feed, now called Explore and the app's home screen. The change is
small: a `city` filter alongside the existing ones, and `CityStrip` in the
list's `ListHeaderComponent` so it scrolls away with the feed.

### [ ] `src/components/suggestion-tile.tsx`
Gained `width`, `compact` and `selected` so the same tile works small. The
compact one shows a tick instead of the corner arrow, because it no longer
goes anywhere.

### [ ] `src/services/places.ts`
`PlaceFilters` has a `rules` field now, which `getPlaces()` hands to the same
`matchesRules()` the collections use. **Read the comment** -- searching the
text "Florence" would also match a place *called* Florence, which isn't what
tapping a tile should do. It also means a tile can say "anywhere in Europe"
without this file knowing what Europe is.

### [ ] Deleted
`(tabs)/(explore)/explore.tsx`, `src/components/explore-page.tsx`,
`src/components/city-tile.tsx`, and the city page `city/[name].tsx`. Five tabs
became four.

### [ ] `src/services/cities.ts`
**Nothing calls this file any more.** The tiles are built from places directly
now, so `getCities()`, `getCityPlaces()` and `getCity()` are all unused.
**Left in place on purpose** with a note, in case someone has a branch using
them -- delete once the team has merged.

---

## 4b. The shared tag vocabulary (~10 min)

### [ ] `src/services/tags.ts`
**Read the comment at the top -- it's the whole argument.** A profile's
interests and a place's "best suited for" are one vocabulary stored as two
tables: `adventure` and `photography` are rows in both, so 22 rows are really
20 tags, and the two don't even slugify the same way (`remote work` vs
`street-food`). The matching the app wants to do -- "does this place suit
you?" -- only works if both sides come from one list.

It presents them as one list without merging the tables, and writes new tags
to `interests` through the database's `add_interest()`. That works because
`places.suited_for` is a plain `text[]` with no foreign key.

### [ ] `src/hooks/use-tags.ts`
Thin React Query wrappers, same shape as `use-interests.ts`.

### [ ] Where it's used
`new-collection.tsx` ("Best suited for") and `upload.tsx` ("Suited for") both
offer the shared list now. They pass **slugs**, not labels, because that's
what `places.suited_for` stores and what collection rules match against.

**Still to do:** a migration joining the two tables. Noted in
`docs/data-layer.md` under Open decisions.

---

## 4c. The save prompt (~10 min)

### [ ] `src/components/save-prompt.tsx`
**Read the comment at the top.** The bar that slides up after you save a
place, plus the context that lets any screen trigger it. It's mounted once in
the tabs layout, not per screen, because you can save from the feed, Place
details or inside a collection and the bar has to outlive the screen changing.

Two messages, and the difference is the point: nothing caught the place →
*"Saved. Add to a collection?"*; auto add caught it → *"Added to France and 2
others. Change?"*. It goes away on its own after 5 seconds, and a second save
replaces the first rather than stacking.

### [ ] `src/components/collection-picker-sheet.tsx`
The Pinterest-style list the bar opens: every collection as a **compact**
`CollectionTile`, sub-collections indented, "New collection" at the bottom.

### [ ] `src/services/collections.ts` — `savePlace` now reports back
It used to return nothing. It gives back the collections auto add put the
place in, so the bar knows what to say. `addToCollection()` is new, for
picking one by hand.

### [ ] `src/hooks/use-saves.ts`
`useToggleSave` passes that list through to `onSuccess`, and `useAddToCollection`
is new.

---

## 5. The routing change (~10 min)

All of this was one change: detail screens used to sit *above* the tabs, so
opening a collection hid the tab bar and left no way back if you'd arrived by
link or reload.

### [ ] `src/app/_layout.tsx` and `src/app/(tabs)/_layout.tsx`
Read the comments at the top of both. The short version: each tab is now a
`(name)` folder with its own stack.

### [ ] `src/app/(tabs)/(feed)/_layout.tsx`
Read **one** of the five tab layouts — they're identical apart from the names.
The comment explains the `(profile,map,explore,saved)` folder, which is
one file that Expo Router copies into every tab's stack.

### [ ] Files that only moved
No contents changed, so there's nothing to read — but **the team needs to pull
before editing them**:
`(tabs)/(profile)/profile.tsx`, `(tabs)/(map)/map.tsx`,
`(tabs)/(explore)/index.tsx`, `(tabs)/(explore)/explore.tsx`,
`(tabs)/(explore)/city/[name].tsx`, and `place/[id].tsx`.

### [ ] `src/components/ui/icon.tsx` — one line
Added a `forward` icon (chevron-right) for the sub-collection rows.

---

## 6. Docs (~5 min)

### [ ] `docs/data-layer.md`
The service tables and the "Open decisions" table both grew. **The decisions
table is the useful bit** — it records what we chose and why, including the two
that came out of bugs.

### [ ] `docs/pages/02-feed.md` and `docs/pages/09-explore.md`
These two record the merge. 09 keeps the thinking behind the tiles (the
popularity ordering, why a tile isn't labelled with a place type) with a note
at the top saying the page itself is gone.

### [ ] The other `docs/pages/*.md` — paths only
Changed only where they named a route file that moved.

---

## Known gaps

Worth knowing before anyone reviews this as "finished":

- **Auto add doesn't run yet.** `applyAutoAdd()` is written and tested but
  nothing calls it, because `savePlace()` doesn't exist until Phase 0.
- **Collections can't be renamed or deleted.** You can make one and that's it.
- **New tags aren't saved to the shared list.** Picking one on Upload works;
  storing it for everyone else needs the Post button to call `addTag()`.
- **`place/[id].tsx` has no fallback back arrow** like the collection screen
  does. Not stranded, since the tab bar is there now, but worth a two-line fix.
- **The tiles aren't personalised yet**, which is the point of them. They're
  ordered by how many places each one has. The TODO in `suggestions.ts` says
  what ranking by the person's own interests needs.
- **Vibe tiles read a bit oddly.** "Skiers in France" comes out of the same
  `describeRules()` that collections use, and the vibe tags are audience words
  (solo, skiers, groups) rather than activities. Place-type tiles ("Cafes in
  France") read better and win ties for that reason, but the wording is worth
  a look.
- **The tiles don't respond to the search box.** The old Explore page filtered
  its tiles as you typed. The search box now filters the places underneath
  instead, and having the tiles vanish as you typed would be odd -- but it does
  mean the row is always the same list.
- **Two lint problems predate this work**: a parse error in
  `src/components/auth-input.tsx` and a warning in `src/types/Name.ts`.
