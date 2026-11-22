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

// A city's id from its name + country, for ProfileCover's "Auto" photo: the
// status only ever carries a city's name (TravelStatus), never its id, so
// this is the only way to turn "Rome, Italy" back into a real city row.
export async function getCityIdByName(name: string, country: string): Promise<string | null> {
  const { data, error } = await supabase.from('cities').select('id').ilike('name', name).ilike('country', country).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
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

// Matches private.slugify() in the core migration, so ids stay in the same
// style whether a city comes from here or from posting a review somewhere new.
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Adds a city that isn't in the list yet, for "Lives in"/"Dream trip" when a
// search turns up nothing. country_code stays empty -- there's no reliable way
// to look up the 2-letter code for a typed-in country here (same note as the
// type above). RLS lets any signed-in person do this (`cities: add`), the same
// policy posting a review in a new city already relies on.
// Returns the existing city instead of a duplicate if the name+country already
// exists (case-insensitively) -- the database enforces that with a unique index.
export async function addProfileCity(name: string, country: string): Promise<ProfileCity> {
  const trimmedName = name.trim();
  const trimmedCountry = country.trim();

  const existing = await supabase
    .from('cities')
    .select('id, name, country, country_code')
    .ilike('name', trimmedName)
    .ilike('country', trimmedCountry)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return toProfileCity(existing.data);

  const id = slugify(`${trimmedName} ${trimmedCountry}`);
  const { data, error } = await supabase
    .from('cities')
    .insert({ id, name: trimmedName, country: trimmedCountry })
    .select('id, name, country, country_code')
    .single();

  if (error) {
    // 23505: someone else added the same city between the check above and this insert.
    if (error.code === '23505') {
      const retry = await supabase
        .from('cities')
        .select('id, name, country, country_code')
        .ilike('name', trimmedName)
        .ilike('country', trimmedCountry)
        .maybeSingle();
      if (retry.error) throw retry.error;
      if (retry.data) return toProfileCity(retry.data);
    }
    throw error;
  }

  return toProfileCity(data);
}
