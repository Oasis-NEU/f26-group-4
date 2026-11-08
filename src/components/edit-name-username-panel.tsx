import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { useCheckUsername } from '@/hooks/use-profiles';

// Name is 1-40 characters. Username is 3-24 characters (a-z, 0-9, _, .),
// stored lowercase, and checked for availability ~0.5s after the user stops
// typing (and again on Save, by the Edit profile screen itself).

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;
const CHECK_DELAY_MS = 500;

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken';

type EditNameUsernamePanelProps = {
  visible: boolean;
  onClose: () => void;
  name: string;
  username: string;
  onChange: (name: string, username: string) => void;
};

export function EditNameUsernamePanel({ visible, onClose, name, username, onChange }: EditNameUsernamePanelProps) {
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const checkUsername = useCheckUsername();
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usernameFormatError =
    username.length > 0 && !USERNAME_PATTERN.test(username)
      ? 'Usernames are 3-24 characters: letters, numbers, _ and . only.'
      : null;

  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (!username || usernameFormatError) {
      checkTimer.current = setTimeout(() => setAvailability('idle'), 0);
      return () => {
        if (checkTimer.current) clearTimeout(checkTimer.current);
      };
    }

    const checkingTimer = setTimeout(() => setAvailability('checking'), 0);
    checkTimer.current = setTimeout(() => {
      // Your own current username counts as available.
      checkUsername(username).then((available) => {
        setAvailability(available ? 'available' : 'taken');
      });
    }, CHECK_DELAY_MS);

    return () => {
      clearTimeout(checkingTimer);
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the username text itself changes
  }, [username]);

  return (
    <EditPanelSheet visible={visible} title="Name & username" onClose={onClose}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(text) => onChange(text.slice(0, 40), username)}
        placeholder="Your name"
        maxLength={40}
      />
      {name.trim().length === 0 && <Text style={styles.errorText}>Add your name</Text>}

      <Text style={[styles.label, styles.secondLabel]}>Username</Text>
      <TextInput
        style={[styles.input, (usernameFormatError || availability === 'taken') && styles.inputError]}
        value={username}
        onChangeText={(text) => onChange(name, text.toLowerCase().slice(0, 24))}
        placeholder="username"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={24}
      />

      {usernameFormatError && <Text style={styles.errorText}>{usernameFormatError}</Text>}
      {!usernameFormatError && availability === 'checking' && <Text style={styles.checkingText}>Checking…</Text>}
      {!usernameFormatError && availability === 'available' && (
        <Text style={styles.availableText}>✓ @{username} is available</Text>
      )}
      {!usernameFormatError && availability === 'taken' && (
        <Text style={styles.errorText}>@{username} is taken. Try another.</Text>
      )}
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  secondLabel: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  errorText: {
    marginTop: 6,
    color: '#e53e3e',
    fontSize: 13,
  },
  checkingText: {
    marginTop: 6,
    color: '#888',
    fontSize: 13,
  },
  availableText: {
    marginTop: 6,
    color: '#2f9e44',
    fontSize: 13,
  },
});
