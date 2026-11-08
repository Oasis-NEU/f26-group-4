// The city list behind "Lives in" and "Dream trip" in Edit profile. Picked
// from a list instead of typed freely, because there's more than one city
// with a given name (e.g. more than one "Boston"). Fake data for now, same
// idea as users.ts: when Supabase is set up, only this file changes.
//
// Named `profile-cities.ts` (not `cities.ts`) and `ProfileCity` (not `City`)
// because src/services/cities.ts already exists for the Explore page (Ruby) --
// that one derives cities from existing places (no stored list, no ids), which
// is a different concept from this curated pick-a-home-city list. Don't rename
// back without checking with Ruby first.

import { mockRequest } from './mock-backend';

export type ProfileCity = {
  id: string;
  name: string; // "Boston"
  country: string; // "United States" -- shown in full next to the name
  countryCode: string; // "US" -- 2-letter, for the flag
};

const mockProfileCities: ProfileCity[] = [
  { id: 'boston-us', name: 'Boston', country: 'United States', countryCode: 'US' },
  { id: 'new-york-us', name: 'New York', country: 'United States', countryCode: 'US' },
  { id: 'paris-fr', name: 'Paris', country: 'France', countryCode: 'FR' },
  { id: 'chamonix-fr', name: 'Chamonix', country: 'France', countryCode: 'FR' },
  { id: 'les-deux-alpes-fr', name: 'Les Deux Alpes', country: 'France', countryCode: 'FR' },
  { id: 'rome-it', name: 'Rome', country: 'Italy', countryCode: 'IT' },
  { id: 'florence-it', name: 'Florence', country: 'Italy', countryCode: 'IT' },
  { id: 'tokyo-jp', name: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  { id: 'lagos-ng', name: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
  { id: 'lisbon-pt', name: 'Lisbon', country: 'Portugal', countryCode: 'PT' },
  { id: 'berlin-de', name: 'Berlin', country: 'Germany', countryCode: 'DE' },
  { id: 'geneva-ch', name: 'Geneva', country: 'Switzerland', countryCode: 'CH' },
  { id: 'barcelona-es', name: 'Barcelona', country: 'Spain', countryCode: 'ES' },
  { id: 'london-gb', name: 'London', country: 'United Kingdom', countryCode: 'GB' },
];

// One city by its id, or null if there isn't one with that id.
export async function getProfileCity(id: string): Promise<ProfileCity | null> {
  return mockRequest(mockProfileCities.find((city) => city.id === id) ?? null);
}

// Cities whose name or country matches the search text, for the picker's results list.
export async function searchProfileCities(query: string): Promise<ProfileCity[]> {
  const q = query.trim().toLowerCase();
  if (!q) return mockRequest(mockProfileCities);

  const matches = mockProfileCities.filter(
    (city) => city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q),
  );
  return mockRequest(matches);
}
