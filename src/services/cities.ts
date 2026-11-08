// Where the Explore page gets its cities from: the city_stats view, which works
// out each city's place count, review count, rating, cover and popularity from
// the places in it. Cities are rows in the database now, shared with the
// "Lives in" and "Dream trip" pickers (profile-cities.ts).

import { supabase } from '@/lib/supabase';

import { getMediaUrl } from './media';
import { PLACE_SELECT, toPlace, type PlaceRow } from './place-rows';

import type { Database } from '@/types/database';
import type { Place } from '@/types/place';

// One city as the Explore page needs it. Every number is worked out by the
// database from the places in that city; nothing here is stored.
export type City = {
  id: string; // 'florence-it'; the city page's route uses it
  name: string; // "Florence"
  country: string; // "Italy"
  placeCount: number; // how many places we have there
  reviewCount: number; // how many reviews across all of those places
  averageRating: number; // the average rating across those reviews
  coverImage: string; // the city's own cover, else the best-rated place's
  placeTypes: string[]; // every type of place the city has: ["cafe", "garden"]
  // The score the tiles are ordered by. Still the placeholder from the mock
  // version: places count most, then reviews, then rating. The real version
  // should come from engagement (views, saves, posts per city).
  popularity: number;
};

type CityStatsRow = Database['public']['Views']['city_stats']['Row'];

function toCity(row: CityStatsRow): City {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    placeCount: row.place_count ?? 0,
    reviewCount: row.review_count ?? 0,
    averageRating: row.average_rating ?? 0,
    coverImage: getMediaUrl(row.cover_path) ?? '',
    placeTypes: row.place_types ?? [],
    popularity: row.popularity ?? 0,
  };
}

export type CityFilters = {
  query?: string; // matches the city name or the country
  placeType?: string; // only cities that have at least one place of this type
};

// Every city we have places for, most popular first. There are few enough
// cities that filtering happens here rather than in the query.
export async function getCities(filters: CityFilters = {}): Promise<City[]> {
  const { data, error } = await supabase.from('city_stats').select('*').order('popularity', { ascending: false });
  if (error) throw error;

  const query = filters.query?.trim().toLowerCase() ?? '';
  return data.map(toCity).filter((city) => {
    if (query && !city.name.toLowerCase().includes(query) && !city.country.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.placeType && !city.placeTypes.includes(filters.placeType)) {
      return false;
    }
    return true;
  });
}

// Every place in one city, best-rated first. Used by the city page the tiles open.
export async function getCityPlaces(cityId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select(PLACE_SELECT)
    .eq('city_id', cityId)
    .order('average_rating', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data as unknown as PlaceRow[]).map(toPlace);
}

// One city on its own, or null if we have no places there.
export async function getCity(cityId: string): Promise<City | null> {
  const { data, error } = await supabase.from('city_stats').select('*').eq('id', cityId).maybeSingle();
  if (error) throw error;
  return data ? toCity(data) : null;
}
