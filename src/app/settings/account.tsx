import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import { SettingsRow } from '@/components/settings-row';
import { useSession } from '@/hooks/use-session';

// Your account: the email you sign in with, logging out, and deleting the
// account for good. Changing your email or password needs its own flow, which
// isn't built yet. Phone and birthday aren't stored (docs/backend-plan.md,
// open decision 11).

export default function AccountScreen() {
  const { user, signOut, deleteAccount } = useSession();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState('');

  // Signing out (or deleting the account) ends the session, and the root
  // layout's login gate moves the app to Log in by itself.
  async function handleLogOut() {
    setError('');
    try {
      await signOut();
    } catch {
      setError("Couldn't log out. Try again.");
    }
  }

  async function handleDelete() {
    setIsDeleteOpen(false);
    setError('');
    try {
      await deleteAccount();
    } catch {
      setError("Couldn't delete your account. Try again.");
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.note}>Only you can see these.</Text>

      <View style={styles.card}>
        <SettingsRow title="Email" subtitle={user?.email ?? ''} />
        <View style={styles.divider} />
        <SettingsRow title="Password" subtitle="Changing it isn't built yet" />
      </View>

      <View style={[styles.card, styles.cardSpaced]}>
        <SettingsRow title="Log out" onPress={handleLogOut} />
        <View style={styles.divider} />
        <SettingsRow title="Delete account" destructive onPress={() => setIsDeleteOpen(true)} />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <ConfirmModal
        visible={isDeleteOpen}
        title="Delete account?"
        message="This deletes your profile, posts, photos and collections for good."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  note: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardSpaced: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  error: {
    marginTop: 12,
    marginLeft: 4,
    fontSize: 14,
    color: '#c62828',
  },
});
