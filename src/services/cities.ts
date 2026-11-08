// Where the Explore page gets its cities from.
//
// There is no "city" table anywhere -- a city only exists because places have a
// `city` field. So this file builds the list by grouping the places we already
// have. When Supabase arrives, only this file changes: the Explore page calls
// getCities() and the city page calls getCityPlaces(), and neither of them
// cares where the data came from.

import { mockRequest } from './mock-backend';
import { mockPlaces } from './places';

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

// Every place in one city. Used by the city page the tiles open.
// Best-rated first, so the top of the feed is the city's best.
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
