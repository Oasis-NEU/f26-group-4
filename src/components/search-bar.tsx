import { StyleSheet, TextInput } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors, radius, spacing, type } from '@/theme';

// The search input itself, meant to sit at the top of the screen.
// It doesn't know HOW to search or what the results look like — it just
// reports what the user typed. The screen using this decides what to do
// with that text (e.g. call a search service as the user types).

type SearchBarProps = {
  value: string; // the current text in the box (controlled input)
  onChangeText: (text: string) => void; // called on every keystroke
  onSubmit?: () => void; // called when the user presses "search"/"enter"
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, onSubmit, placeholder }: SearchBarProps) {
  // THEME CODE: the placeholderTextColor below is the only design-system value
  // outside the styles block.
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      placeholder={placeholder ?? 'Search users or places'}
      placeholderTextColor={colors.textMuted}
      returnKeyType="search"
    />
  );
}

// ---------------------------------------------------------------------------
// THEME CODE (design system) -- Ruby
//
// Colours, corner radius and spacing now come from src/theme.ts instead of
// being typed in here. These are LOOKS ONLY -- no logic changed, nothing moved,
// no props changed. Anything marked THEME CODE is safe to ignore while you work.
//
// To change a colour, change it in src/theme.ts so every screen updates, rather
// than putting a hex code back in here.
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  input: {
    height: 44,
    // A full oval, like every other field and button in the app. No border --
    // the grey fill is what separates it from the page.
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.fill,
    fontSize: type.body,
    color: colors.text,
  },
});
