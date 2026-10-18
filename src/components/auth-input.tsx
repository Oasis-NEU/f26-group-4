import { StyleSheet, Text, TextInput, View } from 'react-native';

// The props this component receives.
type AuthInputProps = {
  // the text shown above the input, like "Username".
  label: string;

  // The text inside the input.
  value: string;

  // Function called with the new text when someone types.
  onChangeText: (text: string) => void;

  // Optional: hides the text when this is a password field.
  isPassword?: boolean;
};

export function AuthInput({
  label,
  value,
  onChangeText,
  isPassword = false,
}: AuthInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});