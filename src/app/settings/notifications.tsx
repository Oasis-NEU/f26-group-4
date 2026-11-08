import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SettingsRow } from '@/components/settings-row';
import { getSettings, updateSettings } from '@/services/settings';
import type { Settings } from '@/types/settings';

const CURRENT_USER_ID = 'u1';

export default function NotificationsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      getSettings(CURRENT_USER_ID).then((s) => {
        if (isActive) setSettings(s);
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  async function patchNotifications(changes: Partial<Settings['notifications']>) {
    if (!settings) return;
    const previous = settings;
    const notifications = { ...settings.notifications, ...changes };
    setSettings({ ...settings, notifications });
    setError('');
    try {
      await updateSettings(CURRENT_USER_ID, { notifications });
    } catch {
      setSettings(previous);
      setError("Couldn't save. Try again.");
    }
  }

  if (!settings) return null;

  const { notifications } = settings;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <SettingsRow
          title="Pause all"
          right={<Switch value={notifications.paused} onValueChange={(value) => patchNotifications({ paused: value })} />}
        />
      </View>

      <View style={[styles.card, styles.cardSpaced, notifications.paused && styles.cardDisabled]}>
        <SettingsRow
          title="Someone follows me"
          right={
            <Switch
              value={notifications.newFollower}
              disabled={notifications.paused}
              onValueChange={(value) => patchNotifications({ newFollower: value })}
            />
          }
        />
        <View style={styles.divider} />
        <SettingsRow
          title="Someone likes or comments on my post"
          right={
            <Switch
              value={notifications.likesAndComments}
              disabled={notifications.paused}
              onValueChange={(value) => patchNotifications({ likesAndComments: value })}
            />
          }
        />
        <View style={styles.divider} />
        <SettingsRow
          title="A close friend updates their status"
          right={
            <Switch
              value={notifications.closeFriendStatus}
              disabled={notifications.paused}
              onValueChange={(value) => patchNotifications({ closeFriendStatus: value })}
            />
          }
        />
        <View style={styles.divider} />
        <SettingsRow title="Trip overlap alerts" subtitle="Later" right={<Switch value={false} disabled />} />
      </View>

      <Text style={styles.footnote}>
        For one specific person, tap 🔔 on their profile. These switches are for everything else.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardSpaced: {
    marginTop: 16,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
  footnote: {
    marginTop: 16,
    fontSize: 12,
    color: '#888',
  },
  error: {
    marginTop: 12,
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
  },
});
