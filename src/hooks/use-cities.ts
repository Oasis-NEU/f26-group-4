// Cities: the Explore page, a city's page, and the city picker in Edit profile.
import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { getCities, getCity, getCityPlaces, type CityFilters } from '@/services/cities';
import { getDestinationPhotos } from '@/services/destination-photos';
import { addProfileCity, getCityIdByName, getProfileCity, searchProfileCities } from '@/services/profile-cities';

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

// A city's id from its name + country -- ProfileCover's only way to fetch a
// real photo for the status city, which never carries an id on its own.
// Waits while either piece is missing.
export function useCityIdByName(name: string | undefined, country: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cities.idByName(name ?? '', country ?? ''),
    queryFn: name && country ? () => getCityIdByName(name, country) : skipToken,
    staleTime: Infinity,
  });
}

// A few real photos for a city, for the "Dream trip" cover picker. Waits
// while there's no id, and only fetches once the panel actually asks for it
// (see enabled in edit-cover-panel.tsx) -- no point hitting Pixabay until
// someone actually opens that option.
export function useDestinationPhotos(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cities.destinationPhotos(id ?? ''),
    queryFn: id ? () => getDestinationPhotos(id) : skipToken,
    enabled,
    staleTime: Infinity, // a city's photos don't change mid-session
  });
}

// Adds a city the picker didn't have, for "Lives in"/"Dream trip".
export function useAddProfileCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, country }: { name: string; country: string }) => addProfileCity(name, country),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cities.all }),
  });
}
