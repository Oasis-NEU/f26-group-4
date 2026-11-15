// Which part of the world a country is in.
//
// A `Place` only knows its `city` and its `country`. There's nothing on it that
// says "Europe" or "South America", so a collection like "Europe Trip" can't be
// matched without a lookup. That's what this file is.
//
// It's a plain list, not a service -- no network, no user, nothing to swap for
// Supabase later. Importing it straight into a component is fine.
//
//   import { REGIONS, countriesInRegion, regionsForCountry } from '@/lib/regions';
//
// Two sizes of region are in here on purpose:
//   - big ones    "Europe", "Asia", "South America"
//   - smaller     "Western Europe", "Southeast Asia", "Scandinavia"
//
// France is in BOTH "Western Europe" and "Europe", so a "Europe Trip"
// collection catches a place in Chamonix without anyone listing every European
// country by hand. That does mean France is typed twice -- once in each list.
// It's a bit repetitive, but it's easy to read and easy to fix.
//
// NOTE: this is not every country on earth. Add more as the app needs them. A
// country that isn't here just won't match a region rule; nothing breaks.

// Region name -> the countries in it.
// The big regions are first, because those are the ones people pick most.
export const REGIONS: Record<string, string[]> = {
  Europe: [
    'France',
    'Belgium',
    'Netherlands',
    'Luxembourg',
    'Germany',
    'Austria',
    'Switzerland',
    'Ireland',
    'United Kingdom',
    'Spain',
    'Portugal',
    'Italy',
    'Greece',
    'Croatia',
    'Slovenia',
    'Malta',
    'Denmark',
    'Norway',
    'Sweden',
    'Finland',
    'Iceland',
    'Poland',
    'Czechia',
    'Hungary',
    'Romania',
    'Bulgaria',
    'Serbia',
    'Estonia',
    'Latvia',
    'Lithuania',
  ],
  Asia: [
    'Japan',
    'South Korea',
    'China',
    'Taiwan',
    'Mongolia',
    'Thailand',
    'Vietnam',
    'Cambodia',
    'Laos',
    'Malaysia',
    'Singapore',
    'Indonesia',
    'Philippines',
    'India',
    'Nepal',
    'Sri Lanka',
    'Pakistan',
    'Bangladesh',
    'Bhutan',
    'Maldives',
  ],
  Africa: [
    'Morocco',
    'Tunisia',
    'Algeria',
    'Egypt',
    'Senegal',
    'Ghana',
    'Nigeria',
    'Cape Verde',
    'Kenya',
    'Tanzania',
    'Uganda',
    'Rwanda',
    'Ethiopia',
    'Madagascar',
    'South Africa',
    'Namibia',
    'Botswana',
    'Zimbabwe',
    'Mozambique',
  ],
  'North America': ['United States', 'Canada', 'Mexico'],
  'South America': [
    'Brazil',
    'Argentina',
    'Chile',
    'Peru',
    'Bolivia',
    'Ecuador',
    'Colombia',
    'Uruguay',
    'Paraguay',
    'Venezuela',
  ],
  'Middle East': [
    'Turkey',
    'Israel',
    'Jordan',
    'Lebanon',
    'United Arab Emirates',
    'Oman',
    'Qatar',
    'Saudi Arabia',
  ],
  Oceania: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga'],

  // --- Smaller regions, for people who want to be more specific ---
  'Western Europe': [
    'France',
    'Belgium',
    'Netherlands',
    'Luxembourg',
    'Germany',
    'Austria',
    'Switzerland',
    'Ireland',
    'United Kingdom',
  ],
  'Southern Europe': ['Spain', 'Portugal', 'Italy', 'Greece', 'Croatia', 'Slovenia', 'Malta'],
  Scandinavia: ['Denmark', 'Norway', 'Sweden', 'Finland', 'Iceland'],
  'Eastern Europe': [
    'Poland',
    'Czechia',
    'Hungary',
    'Romania',
    'Bulgaria',
    'Serbia',
    'Estonia',
    'Latvia',
    'Lithuania',
  ],
  'East Asia': ['Japan', 'South Korea', 'China', 'Taiwan', 'Mongolia'],
  'Southeast Asia': [
    'Thailand',
    'Vietnam',
    'Cambodia',
    'Laos',
    'Malaysia',
    'Singapore',
    'Indonesia',
    'Philippines',
  ],
  'South Asia': ['India', 'Nepal', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Bhutan', 'Maldives'],
  'Central America': [
    'Guatemala',
    'Belize',
    'Honduras',
    'El Salvador',
    'Nicaragua',
    'Costa Rica',
    'Panama',
  ],
  Caribbean: ['Cuba', 'Jamaica', 'Dominican Republic', 'Puerto Rico', 'Bahamas', 'Barbados'],
};

// Every region name, for the picker on the New collection screen.
// They come out in the order they're written above: big ones first.
export const REGION_NAMES: string[] = Object.keys(REGIONS);

// Compares two names ignoring capitals and spaces, so "france" matches "France".
function sameName(first: string, second: string): boolean {
  return first.trim().toLowerCase() === second.trim().toLowerCase();
}

// Every country in a region. A region we don't know gives back an empty list
// instead of crashing, so a typo in old data doesn't break a screen.
export function countriesInRegion(region: string): string[] {
  for (const name of REGION_NAMES) {
    if (sameName(name, region)) {
      return REGIONS[name];
    }
  }

  return [];
}

// Is this country inside this region?
export function isCountryInRegion(country: string, region: string): boolean {
  const countries = countriesInRegion(region);

  for (const name of countries) {
    if (sameName(name, country)) {
      return true;
    }
  }

  return false;
}

// Every region a country is in, e.g. France -> ["Europe", "Western Europe"].
export function regionsForCountry(country: string): string[] {
  const found: string[] = [];

  for (const region of REGION_NAMES) {
    if (isCountryInRegion(country, region)) {
      found.push(region);
    }
  }

  return found;
}
