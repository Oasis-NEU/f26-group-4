import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// One choice in the dropdown.
type DropdownOption = {
  label: string; // What the person sees, like "United States".
  value: string; // What the app saves, like "US".
};

type OnboardingDropdownProps = {
  label: string; // Tells the person what to choose.
  options: DropdownOption[]; // The choices in the list.
  value?: string; // The saved choice, if there is one.
  onChange: (value: string) => void; // Gives the choice back to the screen.
};

export function OnboardingDropdown({
  label,
  options,
  value,
  onChange,
}: OnboardingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  function chooseOption(option: DropdownOption) {
    onChange(option.value);
    setIsOpen(false);
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption?.label ?? 'No selection'}`}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen(!isOpen)}
        style={styles.trigger}
      >
        <Text>{selectedOption?.label ?? 'Choose an option'}</Text>
        <Text>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isOpen && (
        <ScrollView
          style={styles.options}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: option.value === value }}
              onPress={() => chooseOption(option)}
              style={styles.option}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  trigger: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
  },
  options: {
    maxHeight: 220,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
  },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});