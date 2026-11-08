// Where place data comes from. Right now it's fake data kept in this file.
// When Supabase is set up, only this file changes -- the pages that call
// getPlace() and getPlaces() stay exactly the same.

import { mockRequest } from './mock-backend';

import { mockPlace, Place } from '@/types/place';

// All the sample places. mockPlace (the Mountain Peak Café) comes from place.ts
// so the Place page keeps working, and the rest are listed here.
// Exported so src/services/collections.ts can put these places into collections.
//
// Every place has all three ratings, a website, a summary and a few posts, so the
// Place page looks the same no matter which one you open. Before, most of them were
// missing those fields and half the page came out blank.
export const mockPlaces: Place[] = [
  mockPlace,
  {
    id: 'place_002',
    name: 'Les Deux Alpes Lookout',
    averageRating: 4.9,
    friendsRating: 5,
    algorithmRating: 4.7,
    isVerified: true,
    suitedFor: ['adventure', 'skiers', 'photography'],
    placeType: 'excursion',
    bookmark: false,
    addToList: false,
    address: 'Route du Belvédère, Les Deux Alpes',
    city: 'Les Deux Alpes',
    country: 'France',
    website: 'https://example.com/les-deux-alpes',
    directions: 'https://maps.google.com/?q=Les+Deux+Alpes',
    coverImage: 'https://picsum.photos/id/1036/800/600',
    media: [
      { type: 'photo', url: 'https://picsum.photos/id/1037/800/600', caption: 'Sunrise over the valley' },
      { type: 'photo', url: 'https://picsum.photos/id/1039/800/600' },
    ],
    description: 'A viewpoint above the treeline. Best just after sunrise, before the lifts get busy.',
    aiSummary:
      'Everyone says the same thing: go at sunrise. The walk up takes about forty minutes and gets crowded by mid-morning.',
    reviews: [
      {
        id: 'review_021',
        profileName: 'kenji_travels',
        placeID: 'place_002',
        rating: 5,
        placeType: 'excursion',
        reviewText: 'Left at 5:30 and made it for first light. Worth every step.',
        isVerified: true,
        address: 'Route du Belvédère, Les Deux Alpes',
        city: 'Les Deux Alpes',
        country: 'France',
        media: [{ type: 'photo', url: 'https://picsum.photos/id/1036/800/600', caption: 'First light' }],
      },
      {
        id: 'review_022',
        profileName: 'anneke.v',
        placeID: 'place_002',
        rating: 5,
        placeType: 'excursion',
        reviewText: 'Bring layers, it is much colder at the top than at the lift station.',
        isVerified: false,
        address: 'Route du Belvédère, Les Deux Alpes',
        city: 'Les Deux Alpes',
        country: 'France',
        media: [],
        authorId: 'u2', // Kenji
        createdAt: '2026-08-01',
      },
      {
        id: 'review_023',
        profileName: 'j_okafor',
        placeID: 'place_002',
        rating: 4,
        placeType: 'excursion',
        reviewText: 'Busy by 10am. Still a great view, just not a quiet one.',
        isVerified: true,
        address: 'Route du Belvédère, Les Deux Alpes',
        city: 'Les Deux Alpes',
        country: 'France',
        media: [{ type: 'photo', url: '' }],
      },
    ],
    latitude: 45.0110,
    longitude: 6.1220,
    proximity: 12400,
  },
  {
    id: 'place_003',
    name: 'Café Belle Rive',
    averageRating: 4.1,
    friendsRating: 4.4,
    algorithmRating: 3.9,
    isVerified: true,
    suitedFor: ['solo', 'remote work'],
    placeType: 'cafe',
    bookmark: false,
    addToList: false,
    address: '8 Quai du Mont Blanc, Geneva',
    city: 'Geneva',
    country: 'Switzerland',
    website: 'https://example.com/belle-rive',
    directions: 'https://maps.google.com/?q=Quai+du+Mont+Blanc+Geneva',
    coverImage: 'https://picsum.photos/id/225/800/600',
    media: [{ type: 'photo', url: 'https://picsum.photos/id/431/800/600', caption: 'Window seats' }],
    description: 'Quiet in the mornings, with plug sockets at most tables.',
    aiSummary:
      'A reliable spot to work from in the morning. People mention the lake view and the plug sockets, and that it fills up at lunch.',
    reviews: [
      {
        id: 'review_031',
        profileName: 'l.ferreira',
        placeID: 'place_003',
        rating: 4,
        placeType: 'cafe',
        reviewText: 'Took the corner table by the window and stayed three hours. Nobody minded.',
        isVerified: true,
        address: '8 Quai du Mont Blanc, Geneva',
        city: 'Geneva',
        country: 'Switzerland',
        media: [{ type: 'photo', url: '', caption: 'Corner table' }],
      },
      {
        id: 'review_032',
        profileName: 'marcus.hl',
        placeID: 'place_003',
        rating: 4,
        placeType: 'cafe',
        reviewText: 'Coffee is fine, the view is the reason to come.',
        isVerified: false,
        address: '8 Quai du Mont Blanc, Geneva',
        city: 'Geneva',
        country: 'Switzerland',
        media: [],
        authorId: 'u3', // Amara
        createdAt: '2026-07-15',
      },
      {
        id: 'review_033',
        profileName: 'priya_n',
        placeID: 'place_003',
        rating: 5,
        placeType: 'cafe',
        reviewText: 'Avoid 12 to 2, it gets loud. Otherwise perfect for a work morning.',
        isVerified: true,
        address: '8 Quai du Mont Blanc, Geneva',
        city: 'Geneva',
        country: 'Switzerland',
        media: [{ type: 'photo', url: '' }],
      },
    ],
    latitude: 46.2093,
    longitude: 6.1490,
    proximity: 3100,
  },
  {
    id: 'place_004',
    name: 'Trattoria da Nino',
    averageRating: 4.7,
    friendsRating: 4.5,
    algorithmRating: 4.8,
    isVerified: true,
    suitedFor: ['groups', 'family'],
    placeType: 'restaurant',
    bookmark: false,
    addToList: false,
    address: 'Via Garibaldi 14, Florence',
    city: 'Florence',
    country: 'Italy',
    website: 'https://example.com/da-nino',
    directions: 'https://maps.google.com/?q=Via+Garibaldi+14+Florence',
    coverImage: 'https://picsum.photos/id/292/800/600',
    media: [
      { type: 'photo', url: 'https://picsum.photos/id/312/800/600', caption: 'The back room' },
      { type: 'video', url: 'https://example.com/da-nino-tour.mp4', caption: 'Walkthrough' },
    ],
    description: 'Family-run, cash only, no bookings after 8pm.',
    aiSummary:
      'Reviews agree on two things: bring cash, and come before eight. The back room is quieter if you are in a group.',
    reviews: [
      {
        id: 'review_041',
        profileName: 'bea_cortez',
        placeID: 'place_004',
        rating: 5,
        placeType: 'restaurant',
        reviewText: 'Six of us in the back room, no booking, no problem at 7pm.',
        isVerified: true,
        address: 'Via Garibaldi 14, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [{ type: 'photo', url: '', caption: 'The back room' }],
        authorId: 'u1', // Folake
        createdAt: '2026-09-20',
      },
      {
        id: 'review_042',
        profileName: 'd.lindqvist',
        placeID: 'place_004',
        rating: 4,
        placeType: 'restaurant',
        reviewText: 'Cash only caught us out. There is an ATM around the corner.',
        isVerified: false,
        address: 'Via Garibaldi 14, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [],
      },
      {
        id: 'review_043',
        profileName: 'samir.aziz',
        placeID: 'place_004',
        rating: 5,
        placeType: 'restaurant',
        reviewText: 'Best meal of the trip and the cheapest.',
        isVerified: true,
        address: 'Via Garibaldi 14, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [{ type: 'photo', url: '' }],
      },
    ],
    latitude: 43.7735,
    longitude: 11.2440,
    proximity: 540,
  },
  {
    id: 'place_005',
    name: 'Giardino Bardini',
    averageRating: 4.4,
    friendsRating: 4.3,
    algorithmRating: 4.6,
    isVerified: true,
    suitedFor: ['solo', 'couples', 'photography'],
    placeType: 'garden',
    bookmark: false,
    addToList: false,
    address: 'Costa San Giorgio 2, Florence',
    city: 'Florence',
    country: 'Italy',
    website: 'https://example.com/giardino-bardini',
    directions: 'https://maps.google.com/?q=Giardino+Bardini+Florence',
    coverImage: 'https://picsum.photos/id/152/800/600',
    media: [{ type: 'photo', url: 'https://picsum.photos/id/160/800/600' }],
    description: 'Terraced garden with a view back over the river. Quietest on weekday mornings.',
    aiSummary:
      'Quieter than the gardens closer to the centre. Most people recommend a weekday morning, and say the climb up is steeper than it looks.',
    reviews: [
      {
        id: 'review_051',
        profileName: 'hanna.sj',
        placeID: 'place_005',
        rating: 5,
        placeType: 'garden',
        reviewText: 'Had the wisteria tunnel to myself on a Tuesday at nine.',
        isVerified: true,
        address: 'Costa San Giorgio 2, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [{ type: 'photo', url: '', caption: 'Wisteria tunnel' }],
        authorId: 'u1', // Folake
        createdAt: '2026-10-05',
      },
      {
        id: 'review_052',
        profileName: 'o_mbeki',
        placeID: 'place_005',
        rating: 4,
        placeType: 'garden',
        reviewText: 'Steeper than I expected. Good shoes, not sandals.',
        isVerified: false,
        address: 'Costa San Giorgio 2, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [],
      },
      {
        id: 'review_053',
        profileName: 'claire.dup',
        placeID: 'place_005',
        rating: 4,
        placeType: 'garden',
        reviewText: 'The cafe at the top has the view everyone photographs.',
        isVerified: true,
        address: 'Costa San Giorgio 2, Florence',
        city: 'Florence',
        country: 'Italy',
        media: [{ type: 'photo', url: '' }],
      },
    ],
    latitude: 43.7637,
    longitude: 11.2582,
    proximity: 1200,
  },
  {
    id: 'place_006',
    name: 'Kaffeehaus Nord',
    averageRating: 3.8,
    friendsRating: 4.2,
    algorithmRating: 3.6,
    isVerified: false,
    suitedFor: ['solo', 'remote work', 'budget'],
    placeType: 'cafe',
    bookmark: false,
    addToList: false,
    address: 'Nordstraße 44, Berlin',
    city: 'Berlin',
    country: 'Germany',
    website: 'https://example.com/kaffeehaus-nord',
    directions: 'https://maps.google.com/?q=Nordstrasse+44+Berlin',
    coverImage: 'https://picsum.photos/id/326/800/600',
    media: [],
    description: 'Big tables, cheap filter coffee, no music.',
    aiSummary:
      'Cheap, plain and quiet. People come here to work and say the big shared tables are the whole appeal.',
    reviews: [
      {
        id: 'review_061',
        profileName: 'n.behrens',
        placeID: 'place_006',
        rating: 4,
        placeType: 'cafe',
        reviewText: 'No music, no rush. I got a full day of work done here.',
        isVerified: false,
        address: 'Nordstraße 44, Berlin',
        city: 'Berlin',
        country: 'Germany',
        media: [{ type: 'photo', url: '', caption: 'Shared table' }],
        authorId: 'u1', // Folake
        createdAt: '2026-10-12',
      },
      {
        id: 'review_062',
        profileName: 'yuki_t',
        placeID: 'place_006',
        rating: 3,
        placeType: 'cafe',
        reviewText: 'Coffee is nothing special but it is two euros.',
        isVerified: false,
        address: 'Nordstraße 44, Berlin',
        city: 'Berlin',
        country: 'Germany',
        media: [],
      },
      {
        id: 'review_063',
        profileName: 'f.adeyemi',
        placeID: 'place_006',
        rating: 4,
        placeType: 'cafe',
        reviewText: 'Only two plug sockets for the whole room, so get there early.',
        isVerified: true,
        address: 'Nordstraße 44, Berlin',
        city: 'Berlin',
        country: 'Germany',
        media: [{ type: 'photo', url: '' }],
      },
    ],
    latitude: 52.5320,
    longitude: 13.3830,
    proximity: 7600,
  },
];

export type PlaceFilters = {
  query?: string; // matches the place name or city
  placeTypes?: string[]; // empty or missing means any type
  suitedFor?: string[]; // empty or missing means any; a place matches if it has at least one
};

// Places that match the filters, in mock order. With no filters, every place.
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

// Every place type and suited-for tag that exists, used to build the filter options.
// Built from the mock places (a Set drops the repeats) so they stay in sync with the data.
export const PLACE_TYPES = [...new Set(mockPlaces.map((place) => place.placeType))];
export const SUITED_FOR = [...new Set(mockPlaces.flatMap((place) => place.suitedFor))];

// One place by its id, or null if there isn't one with that id.
export async function getPlace(id: string): Promise<Place | null> {
  const found = mockPlaces.find((place) => place.id === id);
  if (found === undefined) {
    return mockRequest(null);
  }
  return mockRequest(found);
}

// Flips the saved state of a place and returns the new value.
// TODO: replace with savePlace/unsavePlace once they exist (see the NOT BUILT YET note in
// src/services/collections.ts), since saved-or-not belongs in collections, not on the place.
export async function toggleBookmark(placeId: string): Promise<boolean> {
  const place = mockPlaces.find((p) => p.id === placeId);
  if (!place) return mockRequest(false);
  place.bookmark = !place.bookmark;
  return mockRequest(place.bookmark);
}
