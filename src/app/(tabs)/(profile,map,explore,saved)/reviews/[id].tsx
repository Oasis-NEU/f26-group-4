import { Redirect, useLocalSearchParams } from 'expo-router';

// Keep old review links working after moving the list into Place Details.
export default function ReviewsRedirect() {
  const { id, reviewId } = useLocalSearchParams<{ id: string; reviewId?: string }>();
  return <Redirect href={{ pathname: '/place/[id]', params: { id, section: 'reviews', reviewId } }} />;
}
