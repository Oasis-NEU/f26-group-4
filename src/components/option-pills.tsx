import { Pressable, StyleSheet, Text, View } from 'react-native';

// A row of selectable pills for a small, fixed set of choices -- used for
// every "pick one of a few options" control in Settings (Map visibility,
// "Lives in" visibility, status sharing levels, etc), so they all look and
// behave the same.

type OptionPillsProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
};

export function OptionPills<T extends string>({ options, selected, onSelect }: OptionPillsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.pill, selected === option.value && styles.pillSelected]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[styles.pillText, selected === option.value && styles.pillTextSelected]}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#fff',
  },
});
