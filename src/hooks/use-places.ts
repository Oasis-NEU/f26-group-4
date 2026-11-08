// Places: the Feed, the Map, Place details, and the filter options.
import { keepPreviousData, queryOptions, skipToken, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { getPlace, getPlaces, getPlacesByIds, getPlaceTypes, getSuitedForTags, type PlaceFilters } from '@/services/places';

// Places that match the filters. While new results load, the old ones stay on
// screen instead of a spinner.
export function usePlaces(filters: PlaceFilters) {
  return useQuery({
    queryKey: queryKeys.places.list(filters),
    queryFn: () => getPlaces(filters),
    placeholderData: keepPreviousData,
  });
}

// One place, with all its reviews. Waits while there's no id yet.
export function usePlace(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.places.detail(id ?? ''),
    queryFn: id ? () => getPlace(id) : skipToken,
  });
}

// Several places by id in one request, e.g. a profile's Map tab.
export function usePlacesByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.places.byIds(ids),
    queryFn: () => getPlacesByIds(ids),
  });
}

// The place types and suited-for tags only change with a migration, so they're
// fetched once and kept.
const placeTypesQuery = queryOptions({
  queryKey: queryKeys.places.types,
  queryFn: getPlaceTypes,
  staleTime: Infinity,
});

const suitedForQuery = queryOptions({
  queryKey: queryKeys.places.tags,
  queryFn: getSuitedForTags,
  staleTime: Infinity,
});

// The options for the filter pills on Feed, Map and Explore. Empty until they
// load; the page still works without them.
export function useFilterOptions(): { placeTypes: string[]; suitedFor: string[] } {
  const placeTypes = useQuery(placeTypesQuery);
  const suitedFor = useQuery(suitedForQuery);
  return { placeTypes: placeTypes.data ?? [], suitedFor: suitedFor.data ?? [] };
}
