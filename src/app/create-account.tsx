import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors } from '@/theme';
import { AuthInput } from '@/components/auth-input';

export default function CreateAccountPage() {
  // Remember what the person types in each box.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Message displayed below the button.
  const [message, setMessage] = useState('');

  // Runs when Create account is pressed.
  function handleCreateAccount() {
    if (
      !email.trim() ||
      !name.trim() ||
      !username.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setMessage('Please fill in every field.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setMessage('Form complete! Account creation is not connected yet.');
  }

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create an account</Text>

      <AuthInput
        label="Email"
        value={email}
        onChangeText={setEmail}
      />

      <AuthInput
        label="Name"
        value={name}
        onChangeText={setName}
      />

      <AuthInput
        label="Username"
        value={username}
        onChangeText={setUsername}
      />

      <AuthInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
      />

      <AuthInput
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        isPassword={true}
      />

      <Button
        title="Create account"
        onPress={handleCreateAccount}
      />

      <Text
        style={styles.message}
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>

      <Link href="/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </ScrollView>
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
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    color: colors.link,
    fontSize: 16,
  },
});