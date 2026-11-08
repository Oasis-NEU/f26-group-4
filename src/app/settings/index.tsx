import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { SettingsRow } from '@/components/settings-row';
import { useProfile } from '@/hooks/use-profiles';
import { useUserId } from '@/hooks/use-session';
import { useSettings } from '@/hooks/use-settings';

export default function SettingsIndexScreen() {
  const userId = useUserId();
  const { data: profile } = useProfile(userId);
  const { data: settings } = useSettings();

  if (!profile || !settings) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.profileCard} onPress={() => router.push('/edit-profile')}>
        <Avatar
          name={profile.name}
          username={profile.username}
          uri={profile.profilePicture}
          userId={profile.id}
          avatarHue={profile.avatarHue}
          size={48}
        />
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSub}>
            @{profile.username} · <Text style={styles.editLink}>Edit profile</Text>
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>SETTINGS</Text>
      <View style={styles.card}>
        <SettingsRow title="Privacy" subtitle="Status, map, who can find you" onPress={() => router.push('/settings/privacy')} />
        <View style={styles.divider} />
        <SettingsRow
          title="Notifications"
          subtitle={settings.notifications.paused ? 'Paused' : 'On'}
          onPress={() => router.push('/settings/notifications')}
        />
        <View style={styles.divider} />
        <SettingsRow title="Account" onPress={() => router.push('/settings/account')} />
        <View style={styles.divider} />
        <SettingsRow title="Your travel" onPress={() => router.push('/settings/travel')} />
        <View style={styles.divider} />
        <SettingsRow title="Help & about" onPress={() => router.push('/settings/help')} />
      </View>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  editLink: {
    color: '#2A9D8F',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: '#ccc',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 16,
  },
});
