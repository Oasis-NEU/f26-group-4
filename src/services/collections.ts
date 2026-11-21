// Saves and collections, from Supabase. The mock collections now live in
// supabase/seed/30_saved.sql.
//
// The database keeps three rules whatever the app does: putting a place in a
// collection also saves it, unsaving a place takes it out of all your
// collections, and collections nest at most three deep.
//
// AUTO ADD. "Bookmarking" and "saving" are the same action: one tap puts a
// place on the Saved page. Auto add is what happens next -- if the place
// matches a collection's rules, it drops into that collection too. The
// decisions, which used to be open questions in this file:
//
//   - A place that matches TWO collections goes in BOTH.
//   - The switch is PER COLLECTION (`auto_add`), not per user, because the
//     rules live on the collection.
//   - It can be RETROACTIVE: the New collection screen says how many saved
//     places already match and offers to put them in.
//   - Taking a place out by hand adds a row to `collection_exclusions`, so
//     auto add doesn't put it straight back.
//   - A sub-collection matching does NOT also add the place to its parent. A
//     parent already shows everything inside its children (see CollectionCard).
//
// The matching runs here, in the app, rather than in a database trigger: a
// rule like "anywhere in Europe" needs the region lookup in src/lib/regions.ts,
// and the New collection screen's "3 places already match" preview uses the
// same functions, so it can't disagree with what actually happens. Moving it
// into a trigger is in docs/data-layer.md, Phase 3.
//
// The auto add columns (`rules`, `auto_add`) and `collection_exclusions` come
// from the collection_rules migration. Until that's on the database, plain
// collections still work: reads ask for `*`, and only a collection with rules
// writes the new columns.

import type { SupabaseClient } from '@supabase/supabase-js';

import { isEmptyRules } from '@/lib/collection-rules';
import { flattenCollections, matchesWithAncestors, rulesOf } from '@/lib/collection-tree';
import { currentUserId, supabase } from '@/lib/supabase';

import { getMediaUrl } from './media';
import { PLACE_SELECT, toPlace, UUID_PATTERN, type PlaceRow } from './place-rows';
import { getPlace } from './places';

import type { Collection, CollectionRules } from '@/types/collection';
import type { Place } from '@/types/place';

// The id used for the built-in "Other Saved" collection. It's always the first card
// on the Saved page, and it can't be renamed or deleted.
export const ALL_SAVED_ID = 'all_saved';

// `*` rather than a list of columns, so the auto add columns come through once
// the collection_rules migration is on the database, and nothing breaks before.
const COLLECTION_SELECT = `*, collection_places(added_at, place:places(${PLACE_SELECT}))`;

type CollectionRow = {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  cover_path: string | null;
  is_private: boolean | null;
  created_at: string;
  // From the collection_rules migration, so missing on a database without it.
  rules?: CollectionRules | null;
  auto_add?: boolean;
  // Missing when a query only asks for the collection's own columns.
  collection_places?: { added_at: string; place: PlaceRow | null }[];
};

// src/types/database.ts doesn't know the auto add columns or the
// collection_exclusions table until it's regenerated from the local stack after
// the collection_rules migration, and the typed client refuses columns it
// doesn't know. So the few queries that write them go through this untyped
// view of the same client. Swap them back to `supabase` once the types are
// regenerated.
const untypedSupabase = supabase as unknown as SupabaseClient;

type CollectionInsert = {
  name: string;
  parent_id: string | null;
  is_private?: boolean; // left out, the owner's new_collections_private setting decides
  rules?: CollectionRules;
  auto_add?: boolean;
};

function toCollection(row: CollectionRow): Collection {
  const places = [...(row.collection_places ?? [])]
    .sort((a, b) => a.added_at.localeCompare(b.added_at))
    .flatMap((item) => (item.place ? [toPlace(item.place)] : []));
  // A collection's country is worked out from its places: only when they share one.
  const countries = new Set(places.map((place) => place.country));

  return {
    id: row.id,
    name: row.name,
    places,
    country: countries.size === 1 ? [...countries][0] : undefined,
    coverImage: getMediaUrl(row.cover_path), // missing: the card uses the first place's image
    ownerId: row.owner_id,
    isPrivate: row.is_private ?? false,
    parentId: row.parent_id ?? undefined,
    rules: row.rules && !isEmptyRules(row.rules) ? row.rules : undefined,
    autoAdd: row.auto_add === true,
  };
}

// Top-level collections, each with its sub-collections inside, as deep as they go.
function toTree(rows: CollectionRow[]): Collection[] {
  const byId = new Map(rows.map((row) => [row.id, toCollection(row)]));
  const top: Collection[] = [];
  for (const row of rows) {
    const collection = byId.get(row.id)!;
    const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
    if (parent) {
      parent.subCollections = [...(parent.subCollections ?? []), collection];
    } else {
      top.push(collection);
    }
  }
  return top;
}

async function collectionsOwnedBy(ownerId: string): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select(COLLECTION_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at');
  if (error) throw error;
  return toTree(data as unknown as CollectionRow[]);
}

// Every collection the signed-in user has made. Other people's public
// collections are readable too, so this asks for yours by owner.
export async function getCollections(): Promise<Collection[]> {
  return collectionsOwnedBy(await currentUserId());
}

// A profile's collections, as the signed-in user may see them: row level
// security leaves out private ones, unless they're yours.
export async function getCollectionsForProfile(ownerId: string): Promise<Collection[]> {
  return collectionsOwnedBy(ownerId);
}

// One collection by its id, with the sub-collections directly inside it.
// Theirs open on their own page. "Other Saved" is built from your saves.
export async function getCollection(id: string): Promise<Collection | null> {
  if (id === ALL_SAVED_ID) {
    return { id: ALL_SAVED_ID, name: 'Other Saved', places: await getAllSavedPlaces() };
  }
  if (!UUID_PATTERN.test(id)) return null;

  const { data, error } = await supabase
    .from('collections')
    .select(COLLECTION_SELECT)
    .or(`id.eq.${id},parent_id.eq.${id}`)
    .order('created_at');
  if (error) throw error;
  return toTree(data as unknown as CollectionRow[]).find((collection) => collection.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Saving. "Bookmarking" and "saving" are the same action.
// ---------------------------------------------------------------------------

// Ids of every place the signed-in user has saved.
export async function getSavedPlaceIds(): Promise<string[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('saves').select('place_id').eq('user_id', userId);
  if (error) throw error;
  return data.map((row) => row.place_id);
}

// Saves a place, then puts it in every auto add collection it matches.
// Saves a place, and says where it ended up.
//
// The list it gives back is the collections auto add put it in -- empty when
// nothing matched. The screen uses that to decide what to say: nothing matched
// means "Saved. Add to a collection?", and something did means "Added to
// France. Change?". An empty list is the normal case for a place that doesn't
// match any rules.
export async function savePlace(placeId: string): Promise<SavedTo[]> {
  // user_id fills itself in from the session.
  const { error } = await supabase.from('saves').insert({ place_id: placeId });

  // Already saved, which is fine, and auto add already ran. Nothing new
  // happened, so there's nothing to tell anyone about.
  if (error?.code === '23505') return [];
  if (error) throw error;

  // The save worked, so a problem from here on doesn't undo the bookmark: the
  // place just doesn't get sorted. Logged rather than thrown for that reason.
  try {
    return await addToAutoAddCollections(placeId);
  } catch (autoAddError) {
    console.warn('Saved the place, but auto add failed', autoAddError);
    return [];
  }
}

// A collection a just-saved place landed in. Only what the message needs.
export type SavedTo = { id: string; name: string };

// Puts a just-saved place in every one of the signed-in user's auto add
// collections whose rules it matches -- and the rules of every collection
// above it, since a sub-collection is narrowed by those (Europe AND France AND
// Paris). Skips the ones it was taken out of by hand.
async function addToAutoAddCollections(placeId: string): Promise<SavedTo[]> {
  const userId = await currentUserId();
  const [owned, place] = await Promise.all([
    // Just the collections' own columns: the rules, not the places inside.
    supabase.from('collections').select('*').eq('owner_id', userId),
    getPlace(placeId),
  ]);
  if (owned.error) throw owned.error;
  if (!place) return [];

  const candidates = flattenCollections(toTree(owned.data as unknown as CollectionRow[])).filter(
    ({ collection, ancestors }) =>
      collection.autoAdd === true && matchesWithAncestors(place, collection.rules, rulesOf(ancestors)),
  );
  if (candidates.length === 0) return [];

  // Asked only when something matched, so a database without the
  // collection_exclusions table yet never gets here.
  const exclusions = await untypedSupabase
    .from('collection_exclusions')
    .select('collection_id')
    .eq('place_id', placeId);
  if (exclusions.error) throw exclusions.error;
  const excludedIds = new Set((exclusions.data as { collection_id: string }[]).map((row) => row.collection_id));

  const wanted = candidates.filter(({ collection }) => !excludedIds.has(collection.id));
  if (wanted.length === 0) return [];

  // ignoreDuplicates: a place that's already in one of them stays put.
  const { error } = await supabase
    .from('collection_places')
    .upsert(
      wanted.map(({ collection }) => ({ collection_id: collection.id, place_id: placeId })),
      { onConflict: 'collection_id,place_id', ignoreDuplicates: true },
    );
  if (error) throw error;

  return wanted.map(({ collection }) => ({ id: collection.id, name: collection.name }));
}

// Unsaving also takes the place out of all your collections (a database rule).
export async function unsavePlace(placeId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('saves').delete().eq('user_id', userId).eq('place_id', placeId);
  if (error) throw error;
}

// Every place saved anywhere, newest save first, for the "Other Saved" card.
export async function getAllSavedPlaces(): Promise<Place[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('saves')
    .select(`created_at, place:places(${PLACE_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as { place: PlaceRow | null }[]).flatMap((row) => (row.place ? [toPlace(row.place)] : []));
}

// The loose saved places: saved, but not in any of your collections.
export async function getSavedPlaces(): Promise<Place[]> {
  const userId = await currentUserId();
  const [all, collected] = await Promise.all([
    getAllSavedPlaces(),
    supabase.from('collection_places').select('place_id, collections!inner(owner_id)').eq('collections.owner_id', userId),
  ]);
  if (collected.error) throw collected.error;
  const collectedIds = new Set(collected.data.map((row) => row.place_id));
  return all.filter((place) => !collectedIds.has(place.id));
}

// Takes a place out of one collection. It stays saved. If the collection
// fills itself, the place is remembered in collection_exclusions so auto add
// doesn't put it straight back.
export async function removeFromCollection(collectionId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_places')
    .delete()
    .eq('collection_id', collectionId)
    .eq('place_id', placeId);
  if (error) throw error;

  const { data, error: readError } = await supabase.from('collections').select('*').eq('id', collectionId).maybeSingle();
  if (readError) throw readError;
  if ((data as unknown as CollectionRow | null)?.auto_add !== true) return;

  const { error: excludeError } = await untypedSupabase
    .from('collection_exclusions')
    .upsert({ collection_id: collectionId, place_id: placeId }, { onConflict: 'collection_id,place_id', ignoreDuplicates: true });
  if (excludeError) throw excludeError;
}

// Puts a place in a collection by hand, and saves it if it wasn't already --
// a place in a collection is always saved. Used by the collection picker that
// opens from the "Saved" message.
//
// It also clears any exclusion: taking a place out of an auto add collection
// remembers that so auto add doesn't put it back, and choosing it again by
// hand plainly means you've changed your mind. The database does that part
// through the collection_places_unexclude trigger.
export async function addToCollection(collectionId: string, placeId: string): Promise<void> {
  const { error: saveError } = await supabase.from('saves').insert({ place_id: placeId });
  if (saveError && saveError.code !== '23505') throw saveError; // 23505: already saved

  const { error } = await supabase
    .from('collection_places')
    .upsert({ collection_id: collectionId, place_id: placeId }, {
      onConflict: 'collection_id,place_id',
      ignoreDuplicates: true,
    });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Making a collection
// ---------------------------------------------------------------------------

export type NewCollectionFields = {
  name: string;
  parentId?: string; // which collection it goes inside; missing means top level
  isPrivate?: boolean; // missing: the owner's "new collections are private" setting decides
  rules?: CollectionRules; // missing or empty: a plain collection you fill by hand
  autoAdd?: boolean; // only counts when there are rules
  placeIds?: string[]; // saved places to put in straight away, e.g. the ones that already match
};

// Makes a collection and gives back its id. Throws when the name is empty;
// the database refuses a fourth level of nesting, and the error says so, so
// the screen can show the message instead of nothing happening.
export async function createCollection(fields: NewCollectionFields): Promise<string> {
  const name = fields.name.trim();
  if (name === '') throw new Error('A collection needs a name.');

  const row: CollectionInsert = { name, parent_id: fields.parentId ?? null };
  if (fields.isPrivate !== undefined) row.is_private = fields.isPrivate;
  // Only a collection with rules sends the auto add columns, so a plain one
  // can be made on a database that doesn't have them yet.
  if (fields.rules !== undefined && !isEmptyRules(fields.rules)) {
    row.rules = fields.rules;
    row.auto_add = fields.autoAdd === true;
  }

  const { data, error } = await untypedSupabase.from('collections').insert(row).select('id').single();
  if (error) throw error;
  const id = (data as { id: string }).id;

  const placeIds = [...new Set(fields.placeIds ?? [])];
  if (placeIds.length > 0) {
    const { error: placesError } = await supabase
      .from('collection_places')
      .insert(placeIds.map((placeId) => ({ collection_id: id, place_id: placeId })));
    if (placesError) throw placesError;
  }

  return id;
}
