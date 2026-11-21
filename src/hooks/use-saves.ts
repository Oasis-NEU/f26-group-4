// Saving places: every bookmark, and the Saved page's lists.
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  addToCollection,
  getAllSavedPlaces,
  getSavedPlaceIds,
  getSavedPlaces,
  savePlace,
  type SavedTo,
  unsavePlace,
} from '@/services/collections';

// Ids of every place the signed-in user has saved. Fetched once and shared by every bookmark.
const savedIdsQuery = queryOptions({
  queryKey: queryKeys.saves.ids,
  queryFn: getSavedPlaceIds,
});

export function useSavedPlaceIds() {
  return useQuery(savedIdsQuery);
}

// Whether one place is saved. `select` picks this place's answer out of the shared list.
export function useIsSaved(placeId: string): boolean {
  const { data } = useQuery({ ...savedIdsQuery, select: (ids) => ids.includes(placeId) });
  return data ?? false;
}

type ToggleSave = { placeId: string; save: boolean };

export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    // Saving gives back the collections auto add put the place in, so the
    // caller can say where it went. Unsaving has nothing to report.
    mutationFn: async ({ placeId, save }: ToggleSave): Promise<SavedTo[]> => {
      if (!save) {
        await unsavePlace(placeId);
        return [];
      }
      return savePlace(placeId);
    },

    // Flip the bookmark straight away, before the server answers
    onMutate: async ({ placeId, save }) => {
      // Stop a refetch that's already running from overwriting the change
      await queryClient.cancelQueries({ queryKey: queryKeys.saves.ids });
      const previous = queryClient.getQueryData<string[]>(queryKeys.saves.ids);
      queryClient.setQueryData<string[]>(queryKeys.saves.ids, (ids = []) =>
        save ? [...ids, placeId] : ids.filter((id) => id !== placeId),
      );
      return { previous };
    },

    // The server said no: put the old list back
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.saves.ids, context?.previous);
    },

    // Either way, refetch everything that depends on what's saved. Unsaving
    // also takes the place out of your collections (a database rule).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}

// Every saved place, for the "Other Saved" card.
export function useAllSavedPlaces() {
  return useQuery({ queryKey: queryKeys.saves.places, queryFn: getAllSavedPlaces });
}

// Saved places that aren't in any collection.
export function useLooseSavedPlaces() {
  return useQuery({ queryKey: queryKeys.saves.loose, queryFn: getSavedPlaces });
}

// Puts a place in a collection by hand, from the collection picker.
export function useAddToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, placeId }: { collectionId: string; placeId: string }) =>
      addToCollection(collectionId, placeId),

    // A place in a collection is always saved, so both lists can change.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
    },
  });
}
