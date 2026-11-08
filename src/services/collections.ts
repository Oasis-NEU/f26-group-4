// Where collection data comes from. Fake data for now, same idea as places.ts:
// when Supabase is set up, only this file changes.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';

import { Collection } from '@/types/collection';
import { Place } from '@/types/place';

// Small helper so the mock data below doesn't repeat whole place objects.
// Not exported, because only this file uses it.
function placesWithIds(ids: string[]): Place[] {
  return mockPlaces.filter((place) => ids.includes(place.id));
}

const mockCollections: Collection[] = [
  {
    id: 'col_europe',
    name: 'Europe Trip',
    places: [], // this one's places live in the sub-collections below
    coverImage: 'https://picsum.photos/id/1036/800/600',
    ownerId: 'u1',
    subCollections: [
      {
        id: 'col_europe_france',
        name: 'France',
        country: 'France',
        places: placesWithIds(['place_001', 'place_002']),
        coverImage: 'https://picsum.photos/id/1018/800/600',
        ownerId: 'u1',
        isAuto: true, // made automatically because the user posted places in France
      },
      {
        id: 'col_europe_italy',
        name: 'Italy',
        country: 'Italy',
        places: placesWithIds(['place_004', 'place_005']),
        coverImage: 'https://picsum.photos/id/292/800/600',
        ownerId: 'u1',
        isAuto: true, // same, for Italy
      },
    ],
  },
  {
    id: 'col_cafes',
    name: 'Coffee Shops',
    places: placesWithIds(['place_001', 'place_003', 'place_006']),
    coverImage: 'https://picsum.photos/id/225/800/600',
    ownerId: 'u1',
  },
  {
    id: 'col_someday',
    name: 'Someday',
    places: placesWithIds(['place_005']),
    ownerId: 'u1',
    isPrivate: true, // a personal wishlist -- only the owner should see this one
  },
];

// Places the user bookmarked but hasn't put in a collection yet.
const mockLooseSavedPlaces: Place[] = placesWithIds(['place_003', 'place_006']);

// The id used for the built-in "All saved" collection. It's always the first card
// on the Saved page, and it can't be renamed or deleted.
export const ALL_SAVED_ID = 'all_saved';

// Every collection the user has made.
export async function getCollections(): Promise<Collection[]> {
  return mockRequest(mockCollections);
}

// A profile's collections, as `viewerId` is allowed to see them: only that
// profile's own collections, and -- unless the viewer IS the owner -- with
// private ones filtered out. Used by the Profile page instead of
// getCollections(), which has no concept of "whose" collections they are and
// is left alone so the Saved tab (always a self-view) keeps working as-is.
export async function getCollectionsForProfile(ownerId: string, viewerId: string): Promise<Collection[]> {
  const isOwner = ownerId === viewerId;
  const visible = mockCollections.filter(
    (collection) => collection.ownerId === ownerId && (isOwner || !collection.isPrivate),
  );
  return mockRequest(visible);
}

// One collection by its id. Looks inside sub-collections too, so opening
// "France" from inside "Europe Trip" finds it.
export async function getCollection(id: string): Promise<Collection | null> {
  // "All saved" isn't a real collection anyone made -- it's every saved place
  // gathered together, so it gets built here instead of being looked up.
  if (id === ALL_SAVED_ID) {
    const everything = await getAllSavedPlaces();
    return mockRequest({ id: ALL_SAVED_ID, name: 'All saved', places: everything });
  }

  for (const collection of mockCollections) {
    if (collection.id === id) {
      return mockRequest(collection);
    }

    // Check this collection's sub-collections before moving to the next one.
    if (collection.subCollections !== undefined) {
      for (const sub of collection.subCollections) {
        if (sub.id === id) {
          return mockRequest(sub);
        }
      }
    }
  }

  return mockRequest(null);
}

// The loose saved places, shown in their own section on the Saved page.
export async function getSavedPlaces(): Promise<Place[]> {
  return mockRequest(mockLooseSavedPlaces);
}

// Every place saved anywhere, for the "All saved" card.
// A place can be in two collections, so duplicates get removed.
export async function getAllSavedPlaces(): Promise<Place[]> {
  const everything: Place[] = [...mockLooseSavedPlaces];

  for (const collection of mockCollections) {
    everything.push(...collection.places);

    if (collection.subCollections !== undefined) {
      for (const sub of collection.subCollections) {
        everything.push(...sub.places);
      }
    }
  }

  // Keep the first copy of each id and skip the rest.
  const seenIds: string[] = [];
  const unique: Place[] = [];
  for (const place of everything) {
    if (!seenIds.includes(place.id)) {
      seenIds.push(place.id);
      unique.push(place);
    }
  }

  return mockRequest(unique);
}

// ---------------------------------------------------------------------------
// NOT BUILT YET -- saving a place
// ---------------------------------------------------------------------------
//
// "Bookmarking" and "saving" are the same action. One tap adds the place to the
// Saved page; tapping again removes it. There is no separate bookmark.
//
// The part I want on top of that: AUTO-SORTING. If the user turns the setting on,
// saving a place should drop it straight into the collection it belongs to instead
// of leaving it loose. So if they already have a "France" collection and they save
// a place in Chamonix, it lands in "France" by itself.
//
// Matching should work on more than country:
//   - country   e.g. a "France" collection catches anything with country "France"
//   - city      e.g. a "Florence" collection catches places in Florence
//   - activity  e.g. a "Cafes" collection catches places with placeType "cafe"
//
// Open questions for the team, not decided yet:
//   - What happens when a place matches two collections? Both? Ask? Most specific?
//   - Is the setting on per user, or per collection?
//   - When it's off, where do saved places go? (Right now: mockLooseSavedPlaces.)
//
// This can't be written until there's a signed-in user and a real database, because
// saving has to be stored somewhere. Rough shape of what goes here eventually:
//
//   export async function savePlace(placeId: string) { ... }
//   export async function unsavePlace(placeId: string) { ... }
//   export async function isPlaceSaved(placeId: string) { ... }
//
// Once those exist, src/components/place-details.tsx should call them instead of
// using its own useState -- see the TODO on the Save button in that file.
