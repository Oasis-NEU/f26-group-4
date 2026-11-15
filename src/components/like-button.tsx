import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

// The heart icon. Filled when liked. It doesn't store anything itself; the parent decides.

type LikeButtonProps = {
  isLiked: boolean;
  onPress: () => void;
};

export function LikeButton({ isLiked, onPress }: LikeButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
      hitSlop={8}
    >
      <Ionicons
        name={isLiked ? 'heart' : 'heart-outline'}
        size={26}
        color={isLiked ? '#ED4956' : '#111'}
      />
    </Pressable>
  );
}
