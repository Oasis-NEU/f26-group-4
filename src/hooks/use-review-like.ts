import { useState } from 'react';

import { likeReview, unlikeReview } from '@/services/reviews';
import type { Review } from '@/types/review';

// The heart on a review: flips straight away, saves in the background, and
// flips back if saving fails.
// TODO (data-layer Phase 1): becomes a useMutation that updates the cache.
export function useReviewLike(review: Review | undefined) {
  const [isLiked, setIsLiked] = useState(review?.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(review?.likeCount ?? 0);

  async function toggleLike() {
    if (!review) return;
    const liked = !isLiked;
    setIsLiked(liked);
    setLikeCount((count) => count + (liked ? 1 : -1));
    try {
      await (liked ? likeReview(review.id) : unlikeReview(review.id));
    } catch {
      setIsLiked(!liked);
      setLikeCount((count) => count + (liked ? -1 : 1));
    }
  }

  return { isLiked, likeCount, toggleLike };
}
