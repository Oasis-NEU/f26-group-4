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
  },
  reviews: {
    all: ['reviews'] as const,
    byUser: (userId: string) => ['reviews', 'user', userId] as const,
    likedIds: ['reviews', 'liked'] as const, // every review the signed-in user liked
  },
  saves: {
    all: ['saves'] as const,
    ids: ['saves', 'ids'] as const, // every saved place id
    places: ['saves', 'places'] as const, // every saved place, for "All saved"
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
    requests: ['follows', 'requests'] as const, // waiting on the signed-in user
    suggestions: ['follows', 'suggestions'] as const,
    friendUsernames: ['follows', 'friend-usernames'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  interests: {
    all: ['interests'] as const,
    byIds: (ids: string[]) => ['interests', 'ids', ids] as const,
    popular: (limit: number) => ['interests', 'popular', limit] as const,
    search: (query: string) => ['interests', 'search', query] as const,
    suggested: ['interests', 'suggested'] as const, // from the signed-in user's posts
  },
};
