// Groups a place type into one of the Traveler Type buckets (profile-badges.tsx)
// and Food Crawl (badges.ts). Shared so both read the same grouping.

const CATEGORY_BY_PLACE_TYPE: Record<string, string> = {
  cafe: 'Food',
  restaurant: 'Food',
  excursion: 'Outdoors',
  garden: 'Outdoors',
  sport: 'Outdoors',
  museum: 'Culture',
  landmark: 'Culture',
};

export function categoryFor(placeType: string): string {
  return CATEGORY_BY_PLACE_TYPE[placeType] ?? 'Other';
}
