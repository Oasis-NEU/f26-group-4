import { Pressable, StyleSheet, Text, View } from 'react-native';

type TagPickerProps = {
  // Heading above the choices.
  label: string;

  // Available choices.
  options: string[];

  // Currently selected choices.
  selected: string[];

  // Gives the updated choices back to the page.
  onChange: (selected: string[]) => void;

  // Allows several choices when true.
  multiple?: boolean;

  // Prevents changes while posting.
  disabled?: boolean;
};

export function TagPicker({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  disabled = false,
}: TagPickerProps) {
  function toggleOption(option: string) {
    if (selected.includes(option)) {
      // Pressing a selected choice removes it.
      onChange(selected.filter((item) => item !== option));
    } else if (multiple) {
      onChange([...selected, option]);
    } else {
      // Only keep this choice in single-selection mode.
      onChange([option]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <Pressable
              key={option}
              onPress={() => toggleOption(option)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{
                selected: isSelected,
                disabled,
              }}
              style={[
                styles.tag,
                isSelected && styles.selectedTag,
                disabled && styles.disabled,
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  isSelected && styles.selectedText,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectedTag: {
    backgroundColor: '#245B45',
    borderColor: '#245B45',
  },
  tagText: {
    color: '#222',
    fontSize: 16,
  },
  selectedText: {
    color: '#FFF',
  },
  disabled: {
    opacity: 0.5,
  },
});
