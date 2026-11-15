// Interests: the chips on a profile, and Edit profile's Interests panel.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import {
  addInterest,
  getInterestsByIds,
  getPopularInterests,
  searchInterests,
  suggestInterestsFromPosts,
} from '@/services/interests';

// Full interests for a list of ids, in the same order.
export function useInterestsByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.interests.byIds(ids),
    queryFn: () => getInterestsByIds(ids),
    placeholderData: keepPreviousData,
  });
}

// "Popular on the app". Only loads while the panel is open.
export function usePopularInterests(limit: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.interests.popular(limit),
    queryFn: () => getPopularInterests(limit),
    enabled,
  });
}

// Interests whose name matches the search text. Empty text gives none.
export function useSearchInterests(query: string) {
  return useQuery({
    queryKey: queryKeys.interests.search(query.trim().toLowerCase()),
    queryFn: () => searchInterests(query),
    placeholderData: keepPreviousData,
  });
}

// "From your posts": suggested from the place types the signed-in user reviewed.
export function useSuggestedInterests(enabled = true) {
  return useQuery({
    queryKey: queryKeys.interests.suggested,
    queryFn: suggestInterestsFromPosts,
    enabled,
  });
}

// Adds a user-made interest, or returns the existing one with the same slug.
export function useAddInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addInterest(name),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.interests.all }),
  });
}
