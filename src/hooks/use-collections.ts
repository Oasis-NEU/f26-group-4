// Collections: the Saved page, a collection's own page, and a profile's Collections tab.
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  getCollection,
  getCollections,
  getCollectionsForProfile,
  removeFromCollection,
} from '@/services/collections';

// The built-in "All saved" collection's id, for screens to link to.
export { ALL_SAVED_ID } from '@/services/collections';

// Every collection the signed-in user made.
export function useCollections() {
  return useQuery({ queryKey: queryKeys.collections.mine, queryFn: getCollections });
}

// Someone's collections, without their private ones unless they're yours.
export function useCollectionsForProfile(ownerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.collections.ofProfile(ownerId ?? ''),
    queryFn: ownerId ? () => getCollectionsForProfile(ownerId) : skipToken,
  });
}

// One collection with its sub-collections, or "All saved".
export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.collections.detail(id ?? ''),
    queryFn: id ? () => getCollection(id) : skipToken,
  });
}

type RemoveFromCollection = { collectionId: string; placeId: string };

// Takes a place out of one collection. It stays saved.
export function useRemoveFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ collectionId, placeId }: RemoveFromCollection) => removeFromCollection(collectionId, placeId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
    },
  });
}
