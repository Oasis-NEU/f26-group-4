import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ConfirmModal } from '@/components/confirm-modal';
import { OptionPills } from '@/components/option-pills';
import { SettingsRow } from '@/components/settings-row';
import { getFollowRequests } from '@/services/follows';
import { trimStatusForLevel } from '@/services/users';
import { getSettings, updateSettings } from '@/services/settings';
import { formatStatusText } from '@/utils/status-text';
import type { Audience, Settings } from '@/types/settings';
import type { StatusDetail, TravelStatus } from '@/types/profile';


// Used just to show a live "they'd see: ..." example under the default
// sharing pills -- these aren't anyone's real status.
const EXAMPLE_STATUS: TravelStatus = { kind: 'traveling', city: 'Rome', country: 'Italy', until: '2026-11-20' };

const SHARING_OPTIONS: { value: StatusDetail; label: string }[] = [
  { value: 'hidden', label: 'Off' },
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
  { value: 'full', label: '+ Dates' },
];

const MAP_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'closeFriends', label: 'Close friends' },
  { value: 'onlyMe', label: 'Only me' },
];

const HOME_OPTIONS: { value: 'city' | 'country' | 'hidden'; label: string }[] = [
  { value: 'city', label: 'City' },
  { value: 'country', label: 'Country only' },
  { value: 'hidden', label: 'Hidden' },
];

const FOLLOW_LIST_OPTIONS: { value: 'everyone' | 'onlyMe'; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'onlyMe', label: 'Only me' },
];

const COLLECTION_OPTIONS: { value: 'public' | 'private'; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
];

export default function PrivacyScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [confirmAction, setConfirmAction] = useState<'turnOn' | 'turnOff' | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      Promise.all([getSettings(), getFollowRequests()]).then(([s, requests]) => {
        if (!isActive) return;
        setSettings(s);
        setPendingRequestCount(requests.length);
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  async function patch(changes: Partial<Settings>) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...changes });
    setError('');
    try {
      await updateSettings(changes);
    } catch {
      setSettings(previous);
      setError("Couldn't save. Try again.");
    }
  }

  async function confirmTurnOn() {
    setConfirmAction(null);
    await patch({ accountType: 'friendsOnly' });
  }

  async function confirmTurnOff() {
    setConfirmAction(null);
    // Turning friends-only off also accepts every waiting request (a database rule).
    await patch({ accountType: 'public' });
    setPendingRequestCount(0);
  }

  if (!settings) return null;

  const isFriendsOnly = settings.accountType === 'friendsOnly';
  const friendsOnlySubtitle = isFriendsOnly
    ? pendingRequestCount > 0
      ? `On. ${pendingRequestCount} request${pendingRequestCount === 1 ? '' : 's'} waiting in the 📥 inbox on your profile.`
      : 'On. No requests waiting.'
    : 'Anyone can follow you without asking.';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>ACCOUNT TYPE</Text>
      <View style={styles.card}>
        <SettingsRow
          title="Friends-only account"
          subtitle={friendsOnlySubtitle}
          right={
            <Switch value={isFriendsOnly} onValueChange={() => setConfirmAction(isFriendsOnly ? 'turnOff' : 'turnOn')} />
          }
        />
      </View>

      <Text style={styles.sectionLabel}>YOUR STATUS</Text>
      <View style={styles.card}>
        <View style={styles.pillSection}>
          <Text style={styles.pillLabel}>Close friends see</Text>
          <OptionPills
            options={SHARING_OPTIONS}
            selected={settings.defaultStatusSharing.closeFriends}
            onSelect={(value) => patch({ defaultStatusSharing: { ...settings.defaultStatusSharing, closeFriends: value } })}
          />
          <Text style={styles.example}>
            e.g. {formatStatusText(trimStatusForLevel(EXAMPLE_STATUS, settings.defaultStatusSharing.closeFriends)) ?? 'Nothing'}
          </Text>
        </View>

        <View style={[styles.pillSection, styles.pillSectionLast]}>
          <Text style={styles.pillLabel}>Everyone else sees</Text>
          <OptionPills
            options={SHARING_OPTIONS}
            selected={settings.defaultStatusSharing.everyone}
            onSelect={(value) => patch({ defaultStatusSharing: { ...settings.defaultStatusSharing, everyone: value } })}
          />
          <Text style={styles.example}>
            e.g. {formatStatusText(trimStatusForLevel(EXAMPLE_STATUS, settings.defaultStatusSharing.everyone)) ?? 'Nothing'}
          </Text>
        </View>

        <View style={styles.divider} />
        <SettingsRow
          title="Close friends"
          subtitle={`${settings.closeFriendIds.length} ${settings.closeFriendIds.length === 1 ? 'person' : 'people'}`}
          onPress={() => router.push('/settings/close-friends')}
        />
      </View>

      <Text style={styles.sectionLabel}>YOUR PROFILE</Text>
      <View style={styles.card}>
        <View style={styles.pillSection}>
          <Text style={styles.pillLabel}>Who can see your Map tab</Text>
          <OptionPills options={MAP_OPTIONS} selected={settings.mapVisibility} onSelect={(value) => patch({ mapVisibility: value })} />
        </View>
        <View style={styles.pillSection}>
          <Text style={styles.pillLabel}>&quot;Lives in&quot; shows</Text>
          <OptionPills options={HOME_OPTIONS} selected={settings.homeVisibility} onSelect={(value) => patch({ homeVisibility: value })} />
        </View>
        <View style={styles.pillSection}>
          <Text style={styles.pillLabel}>Who can see your followers & following</Text>
          <OptionPills
            options={FOLLOW_LIST_OPTIONS}
            selected={settings.followListsVisibility}
            onSelect={(value) => patch({ followListsVisibility: value })}
          />
        </View>
        <View style={[styles.pillSection, styles.pillSectionLast]}>
          <Text style={styles.pillLabel}>New collections start as</Text>
          <OptionPills
            options={COLLECTION_OPTIONS}
            selected={settings.newCollectionsPrivate ? 'private' : 'public'}
            onSelect={(value) => patch({ newCollectionsPrivate: value === 'private' })}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>FINDING YOU</Text>
      <View style={styles.card}>
        <SettingsRow
          title="Show me in Suggested friends"
          right={<Switch value={settings.showInSuggestions} onValueChange={(value) => patch({ showInSuggestions: value })} />}
        />
        <View style={styles.divider} />
        <SettingsRow
          title="Let people find me by email or phone"
          right={<Switch value={settings.findableByContact} onValueChange={(value) => patch({ findableByContact: value })} />}
        />
        <View style={styles.divider} />
        <SettingsRow
          title="Blocked accounts"
          subtitle={`${settings.blockedIds.length} blocked`}
          onPress={() => router.push('/settings/blocked')}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <ConfirmModal
        visible={confirmAction === 'turnOn'}
        title="Make your account friends-only?"
        message="New followers will need your OK. Their requests go to the 📥 inbox on your profile. People who already follow you stay."
        confirmLabel="Turn on"
        onConfirm={confirmTurnOn}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        visible={confirmAction === 'turnOff'}
        title="Turn off friends-only?"
        message={
          pendingRequestCount > 0
            ? `Your ${pendingRequestCount} waiting request${pendingRequestCount === 1 ? '' : 's'} will be accepted, and anyone will be able to follow you again.`
            : 'Anyone will be able to follow you again.'
        }
        confirmLabel="Turn off"
        onConfirm={confirmTurnOff}
        onCancel={() => setConfirmAction(null)}
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
  pillSection: {
    padding: 16,
    gap: 8,
  },
  pillSectionLast: {
    paddingBottom: 16,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  example: {
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
