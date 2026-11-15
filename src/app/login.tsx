import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthInput } from '@/components/auth-input';
import { DEMO_LOGINS_ENABLED, useSession } from '@/hooks/use-session';
import { colors, radius } from '@/theme';

// The demo characters from supabase/seed/accounts.json, with a line about each.
const DEMO_USERS = [
  { username: 'folake', name: 'Folake', blurb: 'Traveling in Paris. Friends-only, with reviews and collections.' },
  { username: 'kenji_travels', name: 'Kenji', blurb: "Planning Rome. Folake's close friend." },
  { username: 'amara', name: 'Amara', blurb: 'New here, waiting for Folake to accept her follow.' },
];

export default function LoginPage() {
  const { signIn, signInAsDemoUser } = useSession();

  // Remember what the person types.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Message displayed below the button.
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Signing in sets the session, and the root layout moves to the tabs by itself.
  async function run(action: () => Promise<void>, failure: string) {
    setIsBusy(true);
    setMessage('');
    try {
      await action();
    } catch {
      setMessage(failure);
      setIsBusy(false);
    }
  }

  // Runs when the Log in button is pressed.
  function handleLogin() {
    if (!email.trim() || !password) {
      setMessage('Please enter your email and password.');
      return;
    }
    run(() => signIn(email, password), 'Wrong email or password.');
  }

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log in</Text>

      <AuthInput label="Email" value={email} onChangeText={setEmail} />

      <AuthInput label="Password" value={password} onChangeText={setPassword} isPassword={true} />

      <Button title={isBusy ? 'Logging in…' : 'Log in'} onPress={handleLogin} disabled={isBusy} />

      <Text style={styles.message} accessibilityLiveRegion="polite">
        {message}
      </Text>

      <Link href="/create-account" style={styles.link}>
        New here? Create an account
      </Link>

      {DEMO_LOGINS_ENABLED && (
        <View style={styles.demo}>
          <Text style={styles.demoHeading}>Demo: continue as</Text>
          {DEMO_USERS.map((demoUser) => (
            <Pressable
              key={demoUser.username}
              accessibilityRole="button"
              accessibilityLabel={`Continue as ${demoUser.name}`}
              disabled={isBusy}
              onPress={() =>
                run(
                  () => signInAsDemoUser(demoUser.username),
                  `Couldn't sign in as ${demoUser.name}. Has the demo data been loaded (npm run demo:reset)?`,
                )
              }
              style={({ pressed }) => [styles.demoUser, pressed && styles.demoUserPressed]}
            >
              <Text style={styles.demoName}>{demoUser.name}</Text>
              <Text style={styles.demoBlurb}>{demoUser.blurb}</Text>
            </Pressable>
          ))}
        </View>
      )}
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
    color: colors.link,
    fontSize: 16,
  },
  demo: {
    marginTop: 40,
    gap: 10,
  },
  demoHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoUser: {
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.fill,
  },
  demoUserPressed: {
    opacity: 0.7,
  },
  demoName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  demoBlurb: {
    marginTop: 2,
    fontSize: 14,
    color: colors.textMuted,
  },
});
