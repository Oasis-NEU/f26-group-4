// Where collection data comes from. Fake data for now, same idea as places.ts:
// when Supabase is set up, only this file changes.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';

import { describeRulesAsLimit, isEmptyRules, matchesRules } from '@/lib/collection-rules';
import { Collection, CollectionRules } from '@/types/collection';
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
    // A whole-continent collection. Its children inherit this when they're made,
    // which is why "France" below is "Europe + France" rather than starting blank.
    rules: { regions: ['Europe'] },
    subCollections: [
      {
        id: 'col_europe_france',
        name: 'France',
        country: 'France',
        places: placesWithIds(['place_001', 'place_002']),
        coverImage: 'https://picsum.photos/id/1018/800/600',
        ownerId: 'u1',
        parentId: 'col_europe',
        isAuto: true, // made automatically because the user posted places in France
        rules: { countries: ['France'] },
        autoAdd: true, // saving a place in France drops it in here
      },
      {
        id: 'col_europe_italy',
        name: 'Italy',
        country: 'Italy',
        places: placesWithIds(['place_004', 'place_005']),
        coverImage: 'https://picsum.photos/id/292/800/600',
        ownerId: 'u1',
        parentId: 'col_europe',
        isAuto: true, // same, for Italy
        rules: { countries: ['Italy'] },
        autoAdd: true,
      },
    ],
  },
  {
    id: 'col_cafes',
    name: 'Coffee Shops',
    places: placesWithIds(['place_001', 'place_003', 'place_006']),
    coverImage: 'https://picsum.photos/id/225/800/600',
    ownerId: 'u1',
    // A kind of place, anywhere in the world. The other half of the idea.
    rules: { placeTypes: ['cafe'] },
    autoAdd: true,
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

// Makes a COPY of a collection, with its own copies of the lists inside it.
//
// Every function below hands back copies instead of the real mock objects, for
// two reasons:
//
//   1. A real database would. Asking Supabase for a collection gives you rows
//      it just built, not a shared object you can reach back into.
//   2. React compares the old value with the new one and skips re-rendering
//      when they're the same object. Adding a sub-collection changes the mock
//      object in place, so a screen handed that same object again would show
//      nothing new -- which is exactly the bug this fixes.
//
// Three levels of sub-collection because that's the nesting limit.
function copyCollection(collection: Collection, levelsLeft = MAX_COLLECTION_DEPTH): Collection {
  const copy: Collection = { ...collection, places: [...collection.places] };

  if (collection.excludedPlaceIds !== undefined) {
    copy.excludedPlaceIds = [...collection.excludedPlaceIds];
  }

  if (collection.subCollections !== undefined && levelsLeft > 1) {
    copy.subCollections = collection.subCollections.map((sub) => copyCollection(sub, levelsLeft - 1));
  }

  return copy;
}

// Every collection the user has made.
export async function getCollections(): Promise<Collection[]> {
  return mockRequest(mockCollections.map((collection) => copyCollection(collection)));
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
  return mockRequest(visible.map((collection) => copyCollection(collection)));
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

  const found = findCollection(id);

  if (found === null) {
    return mockRequest(null);
  }

  return mockRequest(copyCollection(found));
}

// The loose saved places, shown in their own section on the Saved page.
export async function getSavedPlaces(): Promise<Place[]> {
  return mockRequest(mockLooseSavedPlaces);
}

// Every place saved anywhere, for the "All saved" card.
// A place can be in two collections, so duplicates get removed.
export async function getAllSavedPlaces(): Promise<Place[]> {
  const everything: Place[] = [...mockLooseSavedPlaces];

  // Three loops because collections nest three deep (MAX_COLLECTION_DEPTH),
  // so a place inside Europe Trip > France > Paris still counts as saved.
  for (const top of mockCollections) {
    everything.push(...top.places);

    if (top.subCollections === undefined) {
      continue;
    }

    for (const middle of top.subCollections) {
      everything.push(...middle.places);

      if (middle.subCollections === undefined) {
        continue;
      }

      for (const bottom of middle.subCollections) {
        everything.push(...bottom.places);
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
// Making a collection, and auto add
// ---------------------------------------------------------------------------
//
// "Bookmarking" and "saving" are the same action: one tap puts a place on the
// Saved page. AUTO ADD is what happens next -- if the place matches a
// collection's rules, it drops into that collection instead of sitting loose.
//
// The team's decisions, which used to be open questions in this file:
//
//   - A place that matches TWO collections goes in BOTH. A place can already be
//     in several, and getAllSavedPlaces() takes the duplicates out.
//   - The switch is PER COLLECTION (`autoAdd`), not per user, because the rules
//     live on the collection. profiles.auto_sort_saves stays as a master
//     off-switch for people who don't want any of it.
//   - It can be RETROACTIVE: the New collection screen says how many saved
//     places already match and offers to put them in.
//   - Taking a place out by hand puts its id in `excludedPlaceIds`, so auto add
//     doesn't put it straight back.
//   - A sub-collection matching does NOT also add the place to its parent. A
//     parent already shows everything inside its children (see CollectionCard).
//
// What's still missing is savePlace() / unsavePlace(), which need a signed-in
// user and somewhere to keep the save -- that's Phase 0 in docs/data-layer.md.
// When whoever builds savePlace() gets there, it should call applyAutoAdd()
// below, and that's the whole feature.

// How deep collections can nest. "Europe Trip" > "France" > "Paris" is three
// levels and is allowed; a fourth isn't. Nesting forever makes the back button
// miserable and the cards impossible to lay out.
export const MAX_COLLECTION_DEPTH = 3;

// Until there's a signed-in user (Phase 0), everything belongs to the demo user.
// TODO: swap this for the real user id once login works.
const CURRENT_USER_ID = 'u1';

// One collection in a flat list, with how deep it sits so a picker can indent it.
export type CollectionOption = {
  id: string;
  name: string;
  depth: number; // 1 for a top-level collection
  rules?: CollectionRules;
};

// Every collection, including the ones inside other ones, in one flat list.
// Three loops because collections only go three deep (MAX_COLLECTION_DEPTH),
// same as the way getCollection() above looks inside sub-collections.
function everyCollection(): CollectionOption[] {
  const flat: CollectionOption[] = [];

  for (const top of mockCollections) {
    flat.push({ id: top.id, name: top.name, depth: 1, rules: top.rules });

    if (top.subCollections === undefined) {
      continue;
    }

    for (const middle of top.subCollections) {
      flat.push({ id: middle.id, name: middle.name, depth: 2, rules: middle.rules });

      if (middle.subCollections === undefined) {
        continue;
      }

      for (const bottom of middle.subCollections) {
        flat.push({ id: bottom.id, name: bottom.name, depth: 3, rules: bottom.rules });
      }
    }
  }

  return flat;
}

// The collections allowed to hold a new one inside them: anything that isn't
// already at the bottom of the nesting limit.
export async function getParentOptions(): Promise<CollectionOption[]> {
  const canHoldAChild = everyCollection().filter((option) => option.depth < MAX_COLLECTION_DEPTH);
  return mockRequest(canHoldAChild);
}

// Find one collection anywhere in the tree, the real object rather than the
// flat copy, so changing it changes the mock data.
function findCollection(id: string): Collection | null {
  for (const top of mockCollections) {
    if (top.id === id) {
      return top;
    }

    if (top.subCollections === undefined) {
      continue;
    }

    for (const middle of top.subCollections) {
      if (middle.id === id) {
        return middle;
      }

      if (middle.subCollections === undefined) {
        continue;
      }

      for (const bottom of middle.subCollections) {
        if (bottom.id === id) {
          return bottom;
        }
      }
    }
  }

  return null;
}

// How deep a collection sits. 0 means we couldn't find it.
function depthOf(id: string): number {
  for (const option of everyCollection()) {
    if (option.id === id) {
      return option.depth;
    }
  }

  return 0;
}

// The rules of every collection ABOVE this one: the parent, then its parent.
//
// A sub-collection is NARROWED BY the one it sits in, rather than starting
// with a copy of its rules. "Europe Trip > France > Paris" means a place has
// to match Europe AND France AND Paris -- which is what the nesting looks like
// it means.
//
// It was the other way round at first: a new sub-collection started with its
// parent's rules already filled in. That turned out badly. Making "Paris"
// inside "France" started with "anywhere in France", and because everything
// about WHERE is an either/or (see src/lib/collection-rules.ts), adding the
// city Paris on top read as "France OR Paris" -- so the Paris collection
// hoovered up every French place. Narrowing can't go wrong that way.
export async function getAncestorRules(parentId: string | undefined): Promise<CollectionRules[]> {
  const ancestors: CollectionRules[] = [];

  let currentId = parentId;

  // At most MAX_COLLECTION_DEPTH steps up, so a broken parentId can't loop forever.
  for (let step = 0; step < MAX_COLLECTION_DEPTH; step++) {
    if (currentId === undefined) {
      break;
    }

    const collection = findCollection(currentId);

    if (collection === null) {
      break;
    }

    if (collection.rules !== undefined) {
      ancestors.push(collection.rules);
    }

    currentId = collection.parentId;
  }

  return mockRequest(ancestors);
}

// What a sub-collection is limited to by the collections above it, as a
// phrase the screen can drop into a sentence: "in France, and in Europe".
// Empty when nothing above it has any rules.
export async function describeAncestorLimits(parentId: string | undefined): Promise<string> {
  const ancestors = await getAncestorRules(parentId);
  const parts: string[] = [];

  for (const rules of ancestors) {
    const phrase = describeRulesAsLimit(rules);

    if (phrase !== '') {
      parts.push(phrase);
    }
  }

  return mockRequest(parts.join(' and '));
}

// Does a place match these rules AND every rule set above them?
function matchesWithAncestors(
  place: Place,
  rules: CollectionRules | undefined,
  ancestorRules: CollectionRules[],
): boolean {
  if (!matchesRules(place, rules)) {
    return false;
  }

  for (const ancestor of ancestorRules) {
    if (!matchesRules(place, ancestor)) {
      return false;
    }
  }

  return true;
}

// Which of the places the user has already saved would these rules catch?
// The New collection screen uses this for "3 of your saved places match".
// `parentId` is passed when it's a sub-collection, so the count is limited the
// same way the finished collection will be.
export async function getMatchingSavedPlaces(
  rules: CollectionRules,
  parentId?: string,
): Promise<Place[]> {
  const saved = await getAllSavedPlaces();
  const ancestorRules = await getAncestorRules(parentId);
  const matching: Place[] = [];

  for (const place of saved) {
    if (matchesWithAncestors(place, rules, ancestorRules)) {
      matching.push(place);
    }
  }

  return mockRequest(matching);
}

export type NewCollectionFields = {
  name: string;
  parentId?: string; // which collection it goes inside; missing means top level
  rules?: CollectionRules;
  autoAdd?: boolean;
  isPrivate?: boolean;
  addExistingMatches?: boolean; // run the rules over places that are already saved
};

// Make a collection. Throws when the name is empty or the nesting limit is
// reached, so the screen can show the message instead of nothing happening.
export async function createCollection(fields: NewCollectionFields): Promise<Collection> {
  const name = fields.name.trim();

  if (name === '') {
    throw new Error('A collection needs a name.');
  }

  let parent: Collection | null = null;

  if (fields.parentId !== undefined) {
    parent = findCollection(fields.parentId);

    if (parent === null) {
      throw new Error("That collection doesn't exist any more.");
    }

    if (depthOf(fields.parentId) >= MAX_COLLECTION_DEPTH) {
      throw new Error(
        'Collections only go ' +
          MAX_COLLECTION_DEPTH +
          ' levels deep, like Europe > France > Paris.',
      );
    }
  }

  // Only fill it up now if there are rules to fill it with, and the user asked.
  let places: Place[] = [];

  if (fields.addExistingMatches === true && !isEmptyRules(fields.rules)) {
    places = await getMatchingSavedPlaces(fields.rules!, fields.parentId);
  }

  const collection: Collection = {
    // Good enough for mock data. The database makes real ids (gen_random_uuid).
    id: 'col_' + Date.now().toString(36),
    name,
    places,
    ownerId: CURRENT_USER_ID,
    parentId: fields.parentId,
    rules: isEmptyRules(fields.rules) ? undefined : fields.rules,
    autoAdd: fields.autoAdd === true,
    isPrivate: fields.isPrivate === true,
  };

  if (parent === null) {
    mockCollections.push(collection);
  } else {
    if (parent.subCollections === undefined) {
      parent.subCollections = [];
    }

    parent.subCollections.push(collection);
  }

  return mockRequest(collection);
}

// Put a place into every collection with auto add turned on that it belongs in.
// Gives back the collections it went into, so the app could say "Added to
// France and Coffee Shops".
//
// NOT WIRED UP YET: savePlace() doesn't exist until Phase 0. When it does, it
// should call this straight after saving the place.
export async function applyAutoAdd(place: Place): Promise<Collection[]> {
  const added: Collection[] = [];

  for (const option of everyCollection()) {
    const collection = findCollection(option.id);

    if (collection === null || collection.autoAdd !== true) {
      continue;
    }

    // The user took this one out by hand, so leave it out.
    const excluded = collection.excludedPlaceIds ?? [];

    if (excluded.includes(place.id)) {
      continue;
    }

    // Already in here, so there's nothing to do.
    let alreadyIn = false;

    for (const existing of collection.places) {
      if (existing.id === place.id) {
        alreadyIn = true;
      }
    }

    if (alreadyIn) {
      continue;
    }

    // A sub-collection is also limited by whatever sits above it, so a place
    // has to match the whole chain: Europe AND France AND Paris.
    const ancestorRules = await getAncestorRules(collection.parentId);

    if (matchesWithAncestors(place, collection.rules, ancestorRules)) {
      collection.places.push(place);
      added.push(collection);
    }
  }

  return mockRequest(added);
}

// Take a place out of a collection by hand. The place stays saved. If the
// collection fills itself up, the id is remembered in `excludedPlaceIds` so
// auto add doesn't put it straight back.
export async function removeFromCollection(collectionId: string, placeId: string): Promise<void> {
  const collection = findCollection(collectionId);

  if (collection === null) {
    throw new Error("That collection doesn't exist any more.");
  }

  collection.places = collection.places.filter((place) => place.id !== placeId);

  if (collection.autoAdd === true) {
    const excluded = collection.excludedPlaceIds ?? [];

    if (!excluded.includes(placeId)) {
      collection.excludedPlaceIds = [...excluded, placeId];
    }
  }

  return mockRequest(undefined);
}

// Can this collection hold a sub-collection, or is it already at the bottom of
// the nesting limit? Used by the + inside a collection, which hides itself
// rather than letting someone tap it and get an error.
export async function canAddSubCollection(id: string): Promise<boolean> {
  // "All saved" isn't a real collection, so nothing can go inside it.
  if (id === ALL_SAVED_ID) {
    return mockRequest(false);
  }

  const depth = depthOf(id);

  // depth 0 means we couldn't find it.
  if (depth === 0) {
    return mockRequest(false);
  }

  return mockRequest(depth < MAX_COLLECTION_DEPTH);
}
