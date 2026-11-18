// Comments on a review: reading them, and posting one.
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useProfile } from '@/hooks/use-profiles';
import { useUserId } from '@/hooks/use-session';
import { queryKeys } from '@/lib/query-keys';
import { getComments, postComment } from '@/services/comments';
import type { Comment } from '@/types/comment';

// Every comment on one review, newest first. Waits while there's no id yet, and
// while `enabled` is false: a Feed card only asks once its comments are opened.
// Comments already loaded still come back while it's false.
export function useComments(reviewId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.comments.byReview(reviewId ?? ''),
    queryFn: reviewId ? () => getComments(reviewId) : skipToken,
    enabled,
  });
}

type PostComment = { reviewId: string; text: string };

// Posts a comment. It goes to the top of the list straight away, under your
// username, and comes back out if saving fails. The comment count is part of
// the place data, so places refresh afterwards.
export function usePostComment() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  // Your own profile, for the username on the comment while it saves
  const { data: me } = useProfile(userId);

  return useMutation({
    mutationFn: ({ reviewId, text }: PostComment) => postComment(reviewId, text),
    onMutate: async ({ reviewId, text }) => {
      const key = queryKeys.comments.byReview(reviewId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Comment[]>(key);
      const saving: Comment = {
        id: `saving-${Date.now()}`,
        reviewId,
        authorId: userId,
        author: me?.username ?? 'You',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Comment[]>(key, (comments = []) => [saving, ...comments]);
      return { previous };
    },
    onError: (_error, { reviewId }, context) => {
      queryClient.setQueryData(queryKeys.comments.byReview(reviewId), context?.previous);
    },
    onSettled: (_data, _error, { reviewId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.byReview(reviewId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.places.all });
    },
  });
}
