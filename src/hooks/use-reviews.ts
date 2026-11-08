// Reviews: a person's reviews, likes, and posting from Upload.
import { queryOptions, skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/query-keys';
import { createPost } from '@/services/posts';
import { getLikedReviewIds, getReviewsByAuthor, likeReview, unlikeReview } from '@/services/reviews';

// Every review one person wrote, newest first. Waits while there's no id yet.
export function useReviewsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.byUser(userId ?? ''),
    queryFn: userId ? () => getReviewsByAuthor(userId) : skipToken,
  });
}

// Ids of every review the signed-in user liked, shared by every heart.
const likedIdsQuery = queryOptions({
  queryKey: queryKeys.reviews.likedIds,
  queryFn: getLikedReviewIds,
});

export function useIsLiked(reviewId: string | undefined): boolean {
  const { data } = useQuery({ ...likedIdsQuery, select: (ids) => (reviewId ? ids.includes(reviewId) : false) });
  return data ?? false;
}

type ToggleLike = { reviewId: string; like: boolean };

// The heart flips straight away, and flips back if saving fails.
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, like }: ToggleLike) => (like ? likeReview(reviewId) : unlikeReview(reviewId)),
    onMutate: async ({ reviewId, like }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.likedIds });
      const previous = queryClient.getQueryData<string[]>(queryKeys.reviews.likedIds);
      queryClient.setQueryData<string[]>(queryKeys.reviews.likedIds, (ids = []) =>
        like ? [...ids, reviewId] : ids.filter((id) => id !== reviewId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKeys.reviews.likedIds, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.likedIds });
    },
  });
}

// Upload's Post button. A post can add a place and a city and changes ratings,
// so everything that shows places is refreshed afterwards.
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.places.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.saves.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.interests.suggested });
    },
  });
}
