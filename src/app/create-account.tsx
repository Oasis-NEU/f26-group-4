import { useState } from 'react';
import { Link } from 'expo-router';
import { Button, ScrollView, StyleSheet, Text } from 'react-native';

// THEME CODE -- design system. See the note above the styles at the bottom.
import { colors } from '@/theme';
import { AuthInput } from '@/components/auth-input';
import { useCheckUsername } from '@/hooks/use-profiles';
import { useSession } from '@/hooks/use-session';

// The database's rule for usernames (supabase/migrations, profiles.username).
const USERNAME_PATTERN = /^[a-z0-9._]{3,30}$/;

export default function CreateAccountPage() {
  const { signUp } = useSession();
  const isUsernameAvailable = useCheckUsername();

  // Remember what the person types in each box.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Message displayed below the button.
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Runs when Create account is pressed.
  async function handleCreateAccount() {
    const wantedUsername = username.trim().toLowerCase();

    if (!email.trim() || !name.trim() || !wantedUsername || !password || !confirmPassword) {
      setMessage('Please fill in every field.');
      return;
    }
    if (!USERNAME_PATTERN.test(wantedUsername)) {
      setMessage('Usernames are 3 to 30 letters, numbers, dots or underscores.');
      return;
    }
    if (password.length < 6) {
      setMessage('Passwords need at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }

    setIsBusy(true);
    setMessage('');
    try {
      if (!(await isUsernameAvailable(wantedUsername))) {
        setMessage('That username is taken. Try another.');
        setIsBusy(false);
        return;
      }
      const { needsEmailConfirmation } = await signUp({ email, password, username: wantedUsername, name });
      // Without email confirmation, signing up also signs in, and the root
      // layout moves to the tabs by itself.
      if (needsEmailConfirmation) {
        setMessage('Check your email to confirm your account, then log in.');
        setIsBusy(false);
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : '';
      setMessage(
        /already registered|already exists/i.test(text)
          ? 'An account with that email already exists. Log in instead.'
          : "Couldn't create the account. Check your details and try again.",
      );
      setIsBusy(false);
    }
  }

  return (
    // On iOS the header is see-through, so this keeps the content from starting underneath it.
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create an account</Text>

      <AuthInput label="Email" value={email} onChangeText={setEmail} />

      <AuthInput label="Name" value={name} onChangeText={setName} />

      <AuthInput label="Username" value={username} onChangeText={setUsername} />

      <AuthInput label="Password" value={password} onChangeText={setPassword} isPassword={true} />

      <AuthInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} isPassword={true} />

      <Button
        title={isBusy ? 'Creating account…' : 'Create account'}
        onPress={handleCreateAccount}
        disabled={isBusy}
      />

      <Text style={styles.message} accessibilityLiveRegion="polite">
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
