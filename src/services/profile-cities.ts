// The city list behind "Lives in", "Dream trip" and travel status in Edit
// profile: the `cities` table, the same one places use. Picked from a list
// instead of typed freely, because there's more than one city with a given name
// (e.g. more than one "Boston"); a city's id tells them apart.
//
// Named `profile-cities.ts` (not `cities.ts`) because src/services/cities.ts is
// the Explore page's view of the same table, with counts and covers.

import { supabase } from '@/lib/supabase';

export type ProfileCity = {
  id: string; // 'boston-us'
  name: string; // "Boston"
  country: string; // "United States" -- shown in full next to the name
  countryCode: string; // "US" -- 2-letter, for the flag; empty for cities people added
};

type CityRow = { id: string; name: string; country: string; country_code: string | null };

function toProfileCity(row: CityRow): ProfileCity {
  return { id: row.id, name: row.name, country: row.country, countryCode: row.country_code ?? '' };
}

// One city by its id, or null if there isn't one with that id.
export async function getProfileCity(id: string): Promise<ProfileCity | null> {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, country, country_code')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfileCity(data) : null;
}

// Cities whose name or country matches the search text, for the picker's
// results list. The list is small, so it's filtered here.
export async function searchProfileCities(query: string): Promise<ProfileCity[]> {
  const { data, error } = await supabase.from('cities').select('id, name, country, country_code').order('name');
  if (error) throw error;

  const q = query.trim().toLowerCase();
  const cities = data.map(toProfileCity);
  if (!q) return cities;
  return cities.filter((city) => city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q));
}
