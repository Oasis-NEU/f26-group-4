import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import { SettingsRow } from '@/components/settings-row';

// Email/phone/birthday/password aren't part of the data model yet (no real
// auth/account system), so these rows are placeholders -- each would open its
// own edit flow once that exists. Delete account is the one real action here.

export default function AccountScreen() {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.note}>Only you can see these.</Text>

      <View style={styles.card}>
        <SettingsRow title="Email" subtitle="Not set yet" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="Phone" subtitle="Not set yet" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="Birthday" subtitle="Not set yet" onPress={() => {}} />
        <View style={styles.divider} />
        <SettingsRow title="Password" onPress={() => {}} />
      </View>

      <View style={[styles.card, styles.cardSpaced]}>
        <SettingsRow title="Delete account" destructive onPress={() => setIsDeleteOpen(true)} />
      </View>

      <ConfirmModal
        visible={isDeleteOpen}
        title="Delete account?"
        message="This deletes your profile, posts and collections for good."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setIsDeleteOpen(false);
          // TODO: no real account deletion exists yet -- this just logs out.
          router.replace('/login');
        }}
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
});
