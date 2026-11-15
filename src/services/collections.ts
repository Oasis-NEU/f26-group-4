// Saves and collections, from Supabase. The mock collections now live in
// supabase/seed/30_saved.sql.
//
// The database keeps two rules whatever the app does: putting a place in a
// collection also saves it, and unsaving a place takes it out of all your
// collections.
//
// Auto-sorting saves into collections (by country, city or place type) is
// still to come: docs/backend-plan.md, "Tables for later". Open questions:
// what happens when a place matches two collections, whether the setting is
// per user or per collection, and where saves go when it's off.

import { currentUserId, supabase } from '@/lib/supabase';

import { getMediaUrl } from './media';
import { PLACE_SELECT, toPlace, UUID_PATTERN, type PlaceRow } from './place-rows';

import type { Collection } from '@/types/collection';
import type { Place } from '@/types/place';

// The id used for the built-in "All saved" collection. It's always the first card
// on the Saved page, and it can't be renamed or deleted.
export const ALL_SAVED_ID = 'all_saved';

const COLLECTION_SELECT = `id, owner_id, parent_id, name, cover_path, is_private, created_at, collection_places(added_at, place:places(${PLACE_SELECT}))`;

type CollectionRow = {
  id: string;
  owner_id: string;
  parent_id: string | null;
  name: string;
  cover_path: string | null;
  is_private: boolean | null;
  created_at: string;
  collection_places: { added_at: string; place: PlaceRow | null }[];
};

function toCollection(row: CollectionRow): Collection {
  const places = [...row.collection_places]
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
  };
}

// Top-level collections, each with its sub-collections inside.
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

// One collection by its id, with its sub-collections. "All saved" is built
// from your saves.
export async function getCollection(id: string): Promise<Collection | null> {
  if (id === ALL_SAVED_ID) {
    return { id: ALL_SAVED_ID, name: 'All saved', places: await getAllSavedPlaces() };
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

export async function savePlace(placeId: string): Promise<void> {
  // user_id fills itself in from the session.
  const { error } = await supabase.from('saves').insert({ place_id: placeId });
  if (error && error.code !== '23505') throw error; // 23505: already saved, which is fine
}

// Unsaving also takes the place out of all your collections (a database rule).
export async function unsavePlace(placeId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('saves').delete().eq('user_id', userId).eq('place_id', placeId);
  if (error) throw error;
}

// Every place saved anywhere, newest save first, for the "All saved" card.
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

// Takes a place out of one collection. It stays saved.
export async function removeFromCollection(collectionId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('collection_places')
    .delete()
    .eq('collection_id', collectionId)
    .eq('place_id', placeId);
  if (error) throw error;
}
