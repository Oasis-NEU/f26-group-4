import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthInput } from '@/components/auth-input';

export default function LoginPage() {
  // Remember what the person types.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Message displayed below the button.
  const [message, setMessage] = useState('');

  // Runs when the Log in button is pressed.
  function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setMessage('Please enter your username and password.');
      return;
    }

    setMessage('Form complete! Login is not connected yet.');
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log in</Text>

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

      <Button title="Log in" onPress={handleLogin} />

      <Text
        style={styles.message}
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>

      <Link href="/create-account" style={styles.link}>
        New here? Create an account
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