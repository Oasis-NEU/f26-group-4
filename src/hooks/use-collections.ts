// Collections: the Saved page, a collection's own page, and a profile's Collections tab.
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { canHoldSubCollection, rulesAbove } from '@/lib/collection-tree';
import { queryKeys } from '@/lib/query-keys';
import {
  ALL_SAVED_ID,
  createCollection,
  getCollection,
  getCollections,
  getCollectionsForProfile,
  removeFromCollection,
  type NewCollectionFields,
} from '@/services/collections';

import type { CollectionRules } from '@/types/collection';

// The built-in "Other Saved" collection's id, for screens to link to.
export { ALL_SAVED_ID };
export type { NewCollectionFields };

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

// One collection with its sub-collections, or "Other Saved".
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

// Can this collection hold another one inside it? False for "Other Saved", and
// for one that's already at the bottom of the nesting limit (three deep), so
// the + inside a collection can hide itself instead of leading to an error.
export function useCanAddSubCollection(id: string | undefined): boolean {
  const { data } = useCollections();
  if (id === undefined || id === ALL_SAVED_ID || data === undefined) return false;
  return canHoldSubCollection(data, id);
}

// The rules of the collection a new one goes inside, then of the ones above
// that. A sub-collection is narrowed by them (src/lib/collection-tree.ts).
// Empty for a top-level collection. Pending while your collections load.
export function useRulesAbove(parentId: string | undefined): { rules: CollectionRules[]; isPending: boolean } {
  const { data, isPending } = useCollections();
  if (parentId === undefined) return { rules: [], isPending: false };
  return { rules: rulesAbove(data ?? [], parentId), isPending };
}

// Makes a collection, with any saved places that should go straight in.
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fields: NewCollectionFields) => createCollection(fields),
    // Places put in straight away stop being "loose" saves, so saves change too.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
    },
  });
}
