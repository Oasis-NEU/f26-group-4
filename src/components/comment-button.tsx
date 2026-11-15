import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

// The comment icon, styled like the heart and bookmark, with the comment count next
// to it. It only reports the tap; the parent opens the comments popup.

type CommentButtonProps = {
  count?: number;
  onPress: () => void;
};

export function CommentButton({ count = 0, onPress }: CommentButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View comments (${count})`}
      hitSlop={8}
      style={styles.row}
    >
      <Ionicons name="chatbubble-outline" size={26} color="#111" />
      {count > 0 && <Text style={styles.count}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  count: {
    fontSize: 14,
    color: '#111',
  },
});
