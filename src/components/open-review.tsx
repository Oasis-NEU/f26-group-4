import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import type { Review } from '@/types/review';

type OpenReviewProps = {
  review: Review;
  onPress: () => void;
};

export function OpenReview({ review, onPress }: OpenReviewProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View place details for ${review.profileName}’s review`}
      onPress={onPress}
    >
      <Text numberOfLines={2}>
        <Text
          style={{ fontWeight: '700' }}
          accessibilityRole="link"
          onPress={(event) => {
            event.stopPropagation();
            if (review.authorId) {
              router.push({ pathname: '/user/[id]', params: { id: review.authorId } });
            }
          }}
        >{review.profileName} </Text>
        {review.reviewText}
      </Text>
    </Pressable>
  );
}
