// Every React Query key in the app. Never type a key inline (docs/data-layer.md,
// rule 8). Keys are nested, so invalidating `places.all` (['places']) also
// refreshes everything that starts with 'places'.
import type { CityFilters } from '@/services/cities';
import type { PlaceFilters } from '@/services/places';

export const queryKeys = {
  places: {
    all: ['places'] as const,
    list: (filters: PlaceFilters) => ['places', 'list', filters] as const,
    detail: (id: string) => ['places', 'detail', id] as const,
    byIds: (ids: string[]) => ['places', 'ids', ids] as const,
    types: ['places', 'types'] as const, // the place types, for filters
    tags: ['places', 'tags'] as const, // the suited-for tags, for filters
  },
  cities: {
    all: ['cities'] as const,
    list: (filters: CityFilters) => ['cities', 'list', filters] as const,
    detail: (id: string) => ['cities', 'detail', id] as const,
    places: (id: string) => ['cities', 'places', id] as const,
    pick: (id: string) => ['cities', 'pick', id] as const, // one city from the picker list
    search: (query: string) => ['cities', 'search', query] as const, // the picker's results
    destinationPhotos: (id: string) => ['cities', 'destination-photos', id] as const,
    idByName: (name: string, country: string) => ['cities', 'id-by-name', name, country] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
    comments: (reviewId: string) => ['reviews', 'comments', reviewId] as const,
    likedIds: ['reviews', 'liked'] as const, // every review the signed-in user liked
  },
  saves: {
    all: ['saves'] as const,
    ids: ['saves', 'ids'] as const, // every saved place id
    places: ['saves', 'places'] as const, // every saved place, for "Other Saved"
    loose: ['saves', 'loose'] as const, // saved but not in a collection
  },
  collections: {
    all: ['collections'] as const,
    mine: ['collections', 'mine'] as const,
    ofProfile: (ownerId: string) => ['collections', 'profile', ownerId] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
    byIds: (ids: string[]) => ['profiles', 'ids', ids] as const,
    usernameAvailable: (username: string) => ['profiles', 'username', username] as const,
  },
  follows: {
    all: ['follows'] as const,
    followers: (userId: string) => ['follows', 'followers', userId] as const,
    following: (userId: string) => ['follows', 'following', userId] as const,
    status: (userId: string) => ['follows', 'status', userId] as const, // signed-in user's relationship to userId
    requests: ['follows', 'requests'] as const, // waiting on the signed-in user
    suggestions: ['follows', 'suggestions'] as const,
    friendUsernames: ['follows', 'friend-usernames'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  badges: {
    all: ['badges'] as const,
    mine: ['badges', 'mine'] as const,
    unseen: ['badges', 'unseen'] as const,
    byProfile: (userId: string) => ['badges', 'profile', userId] as const,
  },
  // The shared tag vocabulary -- a profile's interests and a place's
  // "suited for" are one list. See src/services/tags.ts for why.
  tags: {
    all: ['tags'] as const,
    list: (kind: string) => ['tags', 'list', kind] as const,
    search: (kind: string, query: string) => ['tags', 'search', kind, query] as const,
  },
  interests: {
    all: ['interests'] as const,
    byIds: (ids: string[]) => ['interests', 'ids', ids] as const,
    popular: (limit: number) => ['interests', 'popular', limit] as const,
    search: (query: string) => ['interests', 'search', query] as const,
    suggested: ['interests', 'suggested'] as const, // from the signed-in user's posts
  },
};
