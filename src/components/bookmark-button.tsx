import { Pressable, StyleSheet, Text } from 'react-native';

// The bookmark icon. Filled when the place is saved.
// It doesn't save anything itself; the screen decides what happens on press
// (e.g. open the "Save to collection" sheet).

type BookmarkButtonProps = {
  isSaved: boolean;
  onPress: () => void;
};

export function BookmarkButton({ isSaved, onPress }: BookmarkButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove from saved' : 'Save place'}
      hitSlop={8}
    >
      <Text style={styles.icon}>{isSaved ? '🔖' : '🏷️'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
