import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

// The search box. Grey oval, no border -- in this design system things are
// separated by being different colours, not by having a line around them.
//
//   <SearchField value={query} onChangeText={setQuery} placeholder="Search places" />

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchField({ value, onChangeText, placeholder = 'Search' }: SearchFieldProps) {
  return (
    <View style={styles.field}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.fill,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: type.body,
    color: colors.text,
  },
});
