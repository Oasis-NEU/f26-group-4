import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { AuthInput } from '@/components/auth-input';
import { useUser } from '@/hooks/use-user';

export default function LoginPage() {
  const { signIn } = useUser();

  // Remember what the person types.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // True while waiting for Supabase, so the button can't be pressed twice.
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Message displayed below the button.
  const [message, setMessage] = useState('');

  // Runs when the Log in button is pressed.
  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage('Please enter your email and password.');
      return;
    }

    setMessage('');
    setIsSigningIn(true);
    const { error } = await signIn(email.trim(), password);
    setIsSigningIn(false);

    if (error) {
      setMessage(error);
      return;
    }

    // Go to the Feed. Delete this once the login gate in _layout.tsx does it by itself.
    router.replace('/');
  }

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log in</Text>

      <AuthInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        isEmail={true}
      />

      <AuthInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        isPassword={true}
      />

      <Button
        title={isSigningIn ? 'Logging in…' : 'Log in'}
        onPress={handleLogin}
        disabled={isSigningIn}
      />

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