// Where place data comes from: Supabase. The pages that call getPlaces() and
// getPlace() work the same as they did with the mock data. The mock places now
// live in supabase/seed/20_places.sql.

import { supabase } from '@/lib/supabase';

import { PLACE_SELECT, toPlace, UUID_PATTERN, type PlaceRow } from './place-rows';

import type { Place } from '@/types/place';

export type PlaceFilters = {
  query?: string; // matches the place name or city
  placeTypes?: string[]; // empty or missing means any type
  suitedFor?: string[]; // empty or missing means any; a place matches if it has at least one
};

// Places that match the filters, newest first. With no filters, every place.
export async function getPlaces(filters: PlaceFilters = {}): Promise<Place[]> {
  const { data, error } = await supabase
    .rpc('search_places', {
      query: filters.query?.trim() || undefined,
      types: filters.placeTypes?.length ? filters.placeTypes : undefined,
      tags: filters.suitedFor?.length ? filters.suitedFor : undefined,
    })
    .select(PLACE_SELECT);
  if (error) throw error;
  return (data as unknown as PlaceRow[]).map(toPlace);
}

// One place by its id, with all its reviews, or null if there isn't one with that id.
export async function getPlace(id: string): Promise<Place | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await supabase.from('places').select(PLACE_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toPlace(data as unknown as PlaceRow) : null;
}

// Several places by id in one request, e.g. the ones on a profile's Map tab.
export async function getPlacesByIds(ids: string[]): Promise<Place[]> {
  const valid = [...new Set(ids)].filter((id) => UUID_PATTERN.test(id));
  if (valid.length === 0) return [];
  const { data, error } = await supabase.from('places').select(PLACE_SELECT).in('id', valid);
  if (error) throw error;
  return (data as unknown as PlaceRow[]).map(toPlace);
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
