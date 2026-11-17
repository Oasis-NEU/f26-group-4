// The shared tag vocabulary: a profile's interests and a place's "suited for"
// are one list. src/services/tags.ts explains why they have to be.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { addTag, getTags, searchTags, type TagKind } from '@/services/tags';

// Every tag of one kind, most used first.
export function useTags(kind: TagKind) {
  return useQuery({
    queryKey: queryKeys.tags.list(kind),
    queryFn: () => getTags(kind),
  });
}

// Tags matching what's been typed. Empty text gives the whole list, so a
// picker has something to show before anyone types.
export function useSearchTags(kind: TagKind, query: string) {
  return useQuery({
    queryKey: queryKeys.tags.search(kind, query.trim().toLowerCase()),
    queryFn: () => searchTags(kind, query),
    placeholderData: keepPreviousData,
  });
}

// Adds a tag someone typed. Only the shared 'interest' list can grow -- place
// types are fixed by a foreign key, see the service.
export function useAddTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => addTag(name),
    onSettled: () => {
      // The new tag should show up in every picker, and on the Interests
      // panel, which still reads the interests table directly.
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.interests.all });
    },
  });
}
