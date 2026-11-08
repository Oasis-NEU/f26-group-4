import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

// The comment icon, styled like the heart and bookmark. It only reports the tap;
// the parent opens the comments popup.

type CommentButtonProps = {
  onPress: () => void;
};

export function CommentButton({ onPress }: CommentButtonProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="View comments" hitSlop={8}>
      <Ionicons name="chatbubble-outline" size={26} color="#111" />
    </Pressable>
  );
}
