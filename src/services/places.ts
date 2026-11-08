// Where place data comes from: Supabase. The pages that call getPlaces() and
// getPlace() work the same as they did with the mock data. The mock places now
// live in supabase/seed/20_places.sql.

import { supabase } from '@/lib/supabase';

import { getSavedPlaceIds, savePlace, unsavePlace } from './collections';
import { getPersonal, PLACE_SELECT, toPlace, UUID_PATTERN, type PlaceRow } from './place-rows';

import type { Place } from '@/types/place';

export type PlaceFilters = {
  query?: string; // matches the place name or city
  placeTypes?: string[]; // empty or missing means any type
  suitedFor?: string[]; // empty or missing means any; a place matches if it has at least one
};

// Places that match the filters, newest first. With no filters, every place.
export async function getPlaces(filters: PlaceFilters = {}): Promise<Place[]> {
  const [{ data, error }, personal] = await Promise.all([
    supabase
      .rpc('search_places', {
        query: filters.query?.trim() || undefined,
        types: filters.placeTypes?.length ? filters.placeTypes : undefined,
        tags: filters.suitedFor?.length ? filters.suitedFor : undefined,
      })
      .select(PLACE_SELECT),
    getPersonal(),
  ]);
  if (error) throw error;
  return (data as unknown as PlaceRow[]).map((row) => toPlace(row, personal));
}

// One place by its id, with all its reviews, or null if there isn't one with that id.
export async function getPlace(id: string): Promise<Place | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [{ data, error }, personal] = await Promise.all([
    supabase.from('places').select(PLACE_SELECT).eq('id', id).maybeSingle(),
    getPersonal(),
  ]);
  if (error) throw error;
  return data ? toPlace(data as unknown as PlaceRow, personal) : null;
}

// Every place type, in display order, for the filters. These only change with a
// migration (supabase/migrations, place_types).
export async function getPlaceTypes(): Promise<string[]> {
  const { data, error } = await supabase.from('place_types').select('slug').order('sort_order');
  if (error) throw error;
  return data.map((row) => row.slug);
}

// Every suited-for tag, in display order, for the filters.
export async function getSuitedForTags(): Promise<string[]> {
  const { data, error } = await supabase.from('suited_for_tags').select('slug').order('sort_order');
  if (error) throw error;
  return data.map((row) => row.slug);
}

// Saves or unsaves a place and returns whether it's saved now.
// TODO (data-layer Phase 0): screens should call savePlace / unsavePlace
// (collections.ts) through useToggleSave instead.
export async function toggleBookmark(placeId: string): Promise<boolean> {
  const isSaved = (await getSavedPlaceIds()).includes(placeId);
  if (isSaved) {
    await unsavePlace(placeId);
  } else {
    await savePlace(placeId);
  }
  return !isSaved;
}
