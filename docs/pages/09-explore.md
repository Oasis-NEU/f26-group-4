# 9. Explore

Not in the low-fidelity sketch. Explore is a page we added afterwards, in the slot
the Search placeholder used to have in the tab bar.

| | |
| - | - |
| **Route** | `/explore` |
| **File** | `src/app/(tabs)/explore.tsx`, which renders `ExplorePage` from `src/components/explore-page.tsx` |
| **Navigator** | Tab: "Explore". SF Symbol `square.grid.2x2.fill`, Material `grid_view`. |
| **Status** | Built. |

## What it's for

A way into the app that isn't a search box. The page is a grid of **cities**, and
each tile is a filter: tap Florence and you get everything we have in Florence.

A city isn't stored anywhere -- it only exists because places have a `city`
field. `src/services/cities.ts` groups the places by that field and works out
everything a tile shows: how many places, how many reviews, the average rating,
and a cover image (taken from the best-rated place in that city).

## Where it sits in navigation

- **Reached from:** the tab bar.
- **Goes to:** City (`/city/[name]`), by tapping a tile.

## The page

| Part | Build |
| ---- | ----- |
| "Explore" heading + search field | `SearchField`. Typing filters the cities by name or country. |
| Grid of city tiles | `CityTile` in a two-column masonry layout. A tile shows the country, the city name and the place count -- never a place name or a place type, because a tile stands for a whole city. Tiles are different heights, and each city is added to whichever column is currently shorter, so the two sides stay level. |
| Category pills, under the search field | `FilterPill` in a row that scrolls sideways. "Explore" is the off switch; the rest are place types, so "cafe" leaves only the cities that have a cafe. |

### Text on the photos

The photos are flat: no gradient, no panel, no shadow behind the text. The city
name is dark (`colors.text`) and set large (27px, bigger than `type.title`)
because on a tile it's a heading rather than a label. The country and the count
are still white.

Nothing darkens or lightens the photo behind any of it, so how readable a tile
is depends entirely on its cover image -- and the cover image is just whichever
place in that city happens to be rated highest. A dark photo swallows the name,
a pale one swallows the country and count.

If this needs solving, the fix is to move the text off the photo (a caption
under the tile) rather than to put something back over it.

## Ordering the tiles

The tiles are ordered by `popularityScore()` in `src/services/cities.ts`.

**This is a placeholder.** The real version should come from the backend once we
track engagement -- views, saves, posts per city. Until then it scores with what
we actually have: how many places we know about, how many reviews those places
have, and how well they're rated.

It's one named function on purpose. When the real ranking lands, that function
changes and nothing else has to.

## City page

| | |
| - | - |
| **Route** | `/city/[name]`, e.g. `/city/Florence` |
| **File** | `src/app/city/[name].tsx` |
| **Navigator** | Root stack, pushed on top of the tabs with a back button. The screen sets the city's name as the title. |

Every place in that city, best-rated first, with a **Feed / List** toggle
(`ViewToggle` in `src/components/ui`):

- **Feed** -- `PlaceCard`, the same card the home feed uses.
- **List** -- `SavedPlaceRow`, a compact row with a thumbnail.

Both views are the same `FlatList` with a different row, so switching keeps your
place on the page.

## Still to decide

- **Searching for people.** The Search placeholder was the planned home for
  finding other users, and Explore replaced it. `SearchBar` and
  `SearchResultCard` still exist and aren't used by anything. Either Explore
  grows a people section, or searching gets a route of its own.
- **Other kinds of tile.** The grid is cities for now. Countries, or categories
  like "ski towns", would fit the same layout.
- **Where the tiles come from.** Everything here is worked out from the places we
  happen to have. Once there's a backend, cities should probably be real rows
  with their own cover image, rather than borrowing one from a place.
