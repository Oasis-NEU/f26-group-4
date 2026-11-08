// Cities: the Explore page, a city's page, and the city picker in Edit profile.
import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { getCities, getCity, getCityPlaces, type CityFilters } from '@/services/cities';
import { getProfileCity, searchProfileCities } from '@/services/profile-cities';

// Every city with places, most popular first. Old results stay on screen while new ones load.
export function useCities(filters: CityFilters) {
  return useQuery({
    queryKey: queryKeys.cities.list(filters),
    queryFn: () => getCities(filters),
    placeholderData: keepPreviousData,
  });
}

// One city's stats, for its page.
export function useCity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cities.detail(id ?? ''),
    queryFn: id ? () => getCity(id) : skipToken,
  });
}

// Every place in one city, best-rated first.
export function useCityPlaces(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cities.places(id ?? ''),
    queryFn: id ? () => getCityPlaces(id) : skipToken,
  });
}

// One city from the picker list ("Lives in", "Dream trip", status). Waits while
// there's no id; the data is null when there isn't one.
export function useProfileCity(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cities.pick(id ?? ''),
    queryFn: id ? () => getProfileCity(id) : skipToken,
    staleTime: Infinity, // a city's name and country don't change
  });
}

// The picker's results for the search text. Empty text lists every city.
export function useCitySearch(query: string) {
  return useQuery({
    queryKey: queryKeys.cities.search(query.trim().toLowerCase()),
    queryFn: () => searchProfileCities(query),
    placeholderData: keepPreviousData,
  });
}
