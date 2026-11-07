import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

// The bookmark icon. An outline when empty, filled in when the place is saved.
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
      <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={26} color="#111" />
    </Pressable>
  );
}
