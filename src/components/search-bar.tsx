import { StyleSheet, TextInput } from 'react-native';

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
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      placeholder={placeholder ?? 'Search users or places'}
      returnKeyType="search"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eee',
  },
});
