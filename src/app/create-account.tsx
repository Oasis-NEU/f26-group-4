import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
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
    <ScrollView
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
    color: '#0066CC',
    fontSize: 16,
  },
});