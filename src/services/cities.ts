// Where the city tiles get their cities from.
//
// There is no "city" table anywhere -- a city only exists because places have a
// `city` field. So this file builds the list by grouping the places we already
// have. When Supabase arrives, only this file changes: the caller asks for
// getCities() and doesn't care where the data came from.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';
import { mockProfileCities } from './profile-cities';

import type { Place } from '@/types/place';

// One city as the Explore page needs it. This is NOT stored anywhere -- every
// field is worked out from the places in that city.
export type City = {
  name: string; // "Florence"
  country: string; // "Italy"
  placeCount: number; // how many places we have there
  reviewCount: number; // how many reviews across all of those places
  averageRating: number; // the average of the places' average ratings
  coverImage: string; // the cover image of the best-rated place there
  placeTypes: string[]; // every type of place the city has: ["cafe", "garden"]
  popularity: number; // the score the tiles are ordered by -- see below
};

// How "popular" a city is, which decides the order of the tiles.
//
// This is a PLACEHOLDER. The real version should come from the backend once we
// track engagement -- views, saves, posts per city. Until then we score with
// what we actually have: how many places we know about, how many reviews those
// places have, and how well they're rated. Places and reviews are weighted more
// than rating, so a city with lots going on beats one perfect cafe.
//
// Keeping it in one named function means the Explore page doesn't have to
// change when the real ranking lands -- only this function does.
function popularityScore(places: Place[]): number {
  const reviews = places.reduce((total, place) => total + (place.reviews?.length ?? 0), 0);
  const ratingSum = places.reduce((total, place) => total + place.averageRating, 0);
  const averageRating = places.length === 0 ? 0 : ratingSum / places.length;
  return places.length * 10 + reviews * 2 + averageRating;
}

// Turns a group of places in the same city into one City.
function toCity(name: string, places: Place[]): City {
  // The cover image comes from the best-rated place, so the tile always shows
  // the city at its best rather than whichever place happened to be added first.
  const bestRated = [...places].sort((a, b) => b.averageRating - a.averageRating)[0];
  const ratingSum = places.reduce((total, place) => total + place.averageRating, 0);

  return {
    name,
    country: places[0].country,
    placeCount: places.length,
    reviewCount: places.reduce((total, place) => total + (place.reviews?.length ?? 0), 0),
    averageRating: ratingSum / places.length,
    coverImage: bestRated.coverImage,
    // A Set drops the repeats, so three cafes only list "cafe" once.
    placeTypes: [...new Set(places.map((place) => place.placeType))],
    popularity: popularityScore(places),
  };
}

export type CityFilters = {
  query?: string; // matches the city name or the country
  placeType?: string; // only cities that have at least one place of this type
};

// Every city we have places for, most popular first.
export async function getCities(filters: CityFilters = {}): Promise<City[]> {
  // Group the places by city name. A Map keeps one entry per city and lets us
  // push each place into the right group as we go.
  const byCity = new Map<string, Place[]>();
  for (const place of mockPlaces) {
    const group = byCity.get(place.city);
    if (group === undefined) {
      byCity.set(place.city, [place]);
    } else {
      group.push(place);
    }
  }

  const query = filters.query?.trim().toLowerCase() ?? '';
  const cities = [...byCity.entries()]
    .map(([name, places]) => toCity(name, places))
    .filter((city) => {
      if (query && !city.name.toLowerCase().includes(query) && !city.country.toLowerCase().includes(query)) {
        return false;
      }
      if (filters.placeType && !city.placeTypes.includes(filters.placeType)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.popularity - a.popularity);

  return mockRequest(cities);
}

// NOTE: getCityPlaces() and getCity() below have nothing calling them any
// more. They were for the city page, which was deleted when Explore merged
// into the feed -- tapping a city tile now filters the feed in place instead
// of opening a screen. They're left here rather than deleted in case someone
// has a branch using them; delete them once the team has merged.

// Every place in one city, best-rated first.
export async function getCityPlaces(cityName: string): Promise<Place[]> {
  const places = mockPlaces
    .filter((place) => place.city.toLowerCase() === cityName.toLowerCase())
    .sort((a, b) => b.averageRating - a.averageRating);
  return mockRequest(places);
}

// One city on its own, or null if we have no places there.
export async function getCity(cityName: string): Promise<City | null> {
  const places = mockPlaces.filter((place) => place.city.toLowerCase() === cityName.toLowerCase());
  if (places.length === 0) {
    return mockRequest(null);
  }
  return mockRequest(toCity(places[0].city, places));
}

// ---------------------------------------------------------------------------
// Searching for a city by name
// ---------------------------------------------------------------------------
//
// There is no list of every city anywhere in this app, and there shouldn't be
// one typed out by hand -- there are tens of thousands. The right answer is
// GOOGLE PLACES: the same API that will eventually give us real places can
// also autocomplete city names, so a city would be picked from real data
// instead of a list we maintain.
//
// Until that's set up, this suggests the cities the app already knows about
// (from places, and from the Edit profile city list) and the caller lets the
// user type anything else. Typing a city we've never heard of is fine -- it
// just won't suggest anything, and the rule still works because matching is
// done on the city name.
//
// TODO: replace the inside of this function with a Google Places Autocomplete
// call, restricted to `(cities)`. Nothing that calls it has to change.

// Every city name we know, with no repeats, in alphabetical order.
function knownCityNames(): string[] {
  const names: string[] = [];

  for (const place of mockPlaces) {
    if (!names.includes(place.city)) {
      names.push(place.city);
    }
  }

  for (const city of mockProfileCities) {
    if (!names.includes(city.name)) {
      names.push(city.name);
    }
  }

  return names.sort();
}

// City names matching what's been typed. Names that START with the text come
// first, so typing "flo" offers Florence before anything else.
export async function searchCityNames(query: string): Promise<string[]> {
  const text = query.trim().toLowerCase();
  const known = knownCityNames();

  if (text === '') {
    return mockRequest(known);
  }

  const startsWith: string[] = [];
  const contains: string[] = [];

  for (const name of known) {
    const lower = name.toLowerCase();

    if (lower.startsWith(text)) {
      startsWith.push(name);
    } else if (lower.includes(text)) {
      contains.push(name);
    }
  }

  return mockRequest([...startsWith, ...contains]);
}
