import { mockRequest } from './mock-backend';

import type { Place } from '@/types/place';

// Screens get places by calling these functions. The data is mock (fake) for now; later each
// function's body becomes a Supabase query, and the screens calling it don't have to change.

export type PlaceFilters = {
  query?: string; // matches the place name or city
  placeTypes?: string[]; // empty or missing means any type
  suitedFor?: string[]; // empty or missing means any; a place matches if it has at least one
};

const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'Blue Door Cafe',
    averageRating: 4.5,
    friendsRating: 5,
    isVerified: true,
    suitedFor: ['solo', 'remote work'],
    placeType: 'cafe',
    bookmark: false,
    addToList: false,
    address: '12 Rue des Martyrs',
    city: 'Paris',
    country: 'France',
    directions: 'https://maps.apple.com/?q=Blue+Door+Cafe',
    coverImage: 'https://picsum.photos/id/1060/800/1000',
    media: ['https://picsum.photos/id/292/800/1000', 'https://picsum.photos/id/312/800/1000'],
    description: 'Tiny corner cafe with the best almond croissants in the neighborhood. Come early, it fills up fast and the window seats go first.',
    reviews: [
      {
        id: 'r1',
        profileName: 'Maya',
        placeID: '1',
        rating: 5,
        placeType: 'cafe',
        reviewText: 'Went twice in one weekend. Worth the line.',
        isVerified: true,
        address: '12 Rue des Martyrs',
        city: 'Paris',
        country: 'France',
      },
    ],
    latitude: 48.8795,
    longitude: 2.3406,
    proximity: 450,
  },
  {
    id: '2',
    name: 'Lake Tahoe Ski Day',
    averageRating: 4.2,
    isVerified: false,
    suitedFor: ['adventure', 'skiers'],
    placeType: 'sport',
    bookmark: true,
    addToList: false,
    address: 'Heavenly Village Way',
    city: 'South Lake Tahoe',
    country: 'USA',
    directions: 'https://maps.apple.com/?q=Heavenly+Village',
    coverImage: 'https://picsum.photos/id/1036/800/1000',
    media: ['https://picsum.photos/id/1018/800/1000'],
    description: 'Great groomed runs for intermediates. Rent gear in the village to skip the lift-line shuffle.',
    latitude: 38.9353,
    longitude: -119.9400,
    proximity: 5200,
  },
  {
    id: '3',
    name: 'Sunset Kayak Tour',
    averageRating: 3.8,
    friendsRating: 4,
    isVerified: true,
    suitedFor: ['adventure', 'couples'],
    placeType: 'excursion',
    bookmark: false,
    addToList: true,
    address: 'Pier 4',
    city: 'San Diego',
    country: 'USA',
    website: 'https://example.com/kayak',
    directions: 'https://maps.apple.com/?q=Pier+4+San+Diego',
    coverImage: 'https://picsum.photos/id/1015/800/1000',
    media: [],
    latitude: 32.7157,
    longitude: -117.1611,
    proximity: 12000,
  },
];

// Places that match the filters, in mock order
export async function getPlaces(filters: PlaceFilters = {}): Promise<Place[]> {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const matches = mockPlaces.filter((place) => {
    if (query && !place.name.toLowerCase().includes(query) && !place.city.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.placeTypes?.length && !filters.placeTypes.includes(place.placeType)) {
      return false;
    }
    if (filters.suitedFor?.length && !place.suitedFor.some((tag) => filters.suitedFor!.includes(tag))) {
      return false;
    }
    return true;
  });
  return mockRequest(matches);
}

// Every place type and suited-for tag that exists, used to build the filter options
export const PLACE_TYPES = ['cafe', 'excursion', 'sport'];
export const SUITED_FOR = ['solo', 'remote work', 'adventure', 'skiers', 'couples'];

// Flips the saved state of a place and returns the new value
export async function toggleBookmark(placeId: string): Promise<boolean> {
  const place = mockPlaces.find((p) => p.id === placeId);
  if (!place) return mockRequest(false);
  place.bookmark = !place.bookmark;
  return mockRequest(place.bookmark);
}
