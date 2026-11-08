import { Pressable, StyleSheet, Text } from 'react-native';

// The comment icon. It only reports the tap; the parent opens the comments popup.

type CommentButtonProps = {
  count: number;
  onPress: () => void;
};

export function CommentButton({ count, onPress }: CommentButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View comments (${count})`}
      hitSlop={8}
      style={styles.row}
    >
      <Text style={styles.icon}>💬</Text>
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
  icon: {
    fontSize: 24,
  },
  count: {
    fontSize: 14,
    color: '#444',
  },
});
