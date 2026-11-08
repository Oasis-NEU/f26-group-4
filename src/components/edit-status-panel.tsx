import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EditCityPanel } from '@/components/edit-city-panel';
import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { getProfileCity } from '@/services/profile-cities';
import { trimStatusForLevel } from '@/services/users';
import { formatStatusText } from '@/utils/status-text';
import type { Profile, StatusDetail, TravelStatus } from '@/types/profile';

// Status panel, styled like a boarding pass: the top part sets Home/
// Traveling/Planning + city + date, the "torn-off" bottom part always shows
// what Close friends and Everyone else currently see, using the same
// trimStatusForLevel the real profile page trims with.
//
// Dates are plain text (YYYY-MM-DD / YYYY-MM) rather than a calendar picker --
// no date-picker library is installed, and this keeps scope to what's needed
// for the mock data.

type StatusKind = TravelStatus['kind'];
type Sharing = { closeFriends: StatusDetail; everyone: StatusDetail };

const SHARING_OPTIONS: { level: StatusDetail; label: string }[] = [
  { level: 'hidden', label: 'Off' },
  { level: 'country', label: 'Country' },
  { level: 'city', label: 'City' },
  { level: 'full', label: '+ Dates' },
];

type EditStatusPanelProps = {
  visible: boolean;
  onClose: () => void;
  status: Profile['status'];
  onChange: (status: Profile['status']) => void;
};

export function EditStatusPanel({ visible, onClose, status, onChange }: EditStatusPanelProps) {
  const [kind, setKind] = useState<StatusKind>(status.kind);
  const [city, setCity] = useState<string | undefined>(status.kind !== 'home' ? status.city : undefined);
  const [country, setCountry] = useState<string | undefined>(status.kind !== 'home' ? status.country : undefined);
  const [until, setUntil] = useState(status.kind === 'traveling' ? status.until ?? '' : '');
  const [month, setMonth] = useState(status.kind === 'planning' ? status.month ?? '' : '');
  const [sharing, setSharing] = useState<Sharing>(status.sharing);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);

  // Composes and reports the new status, but only once there's a city chosen
  // for Traveling/Planning -- until then the panel just holds the pending
  // selection locally rather than reporting a half-finished status.
  function commit(next: {
    kind: StatusKind;
    city?: string;
    country?: string;
    until?: string;
    month?: string;
    sharing: Sharing;
  }) {
    if (next.kind === 'home') {
      onChange({ kind: 'home', sharing: next.sharing });
      return;
    }
    if (!next.city || !next.country) return; // incomplete -- wait for a city before reporting up

    if (next.kind === 'traveling') {
      onChange({ kind: 'traveling', city: next.city, country: next.country, until: next.until || undefined, sharing: next.sharing });
    } else {
      onChange({ kind: 'planning', city: next.city, country: next.country, month: next.month || undefined, sharing: next.sharing });
    }
  }

  function handleKindChange(newKind: StatusKind) {
    setKind(newKind);
    commit({ kind: newKind, city, country, until, month, sharing });
  }

  async function handleCitySelect(cityId: string) {
    const record = await getProfileCity(cityId);
    if (!record) return;
    setCity(record.name);
    setCountry(record.country);
    commit({ kind, city: record.name, country: record.country, until, month, sharing });
  }

  function handleDateChange(text: string) {
    if (kind === 'traveling') {
      setUntil(text);
      commit({ kind, city, country, until: text, month, sharing });
    } else if (kind === 'planning') {
      setMonth(text);
      commit({ kind, city, country, until, month: text, sharing });
    }
  }

  function handleSharingChange(audience: 'closeFriends' | 'everyone', level: StatusDetail) {
    const nextSharing = { ...sharing, [audience]: level };
    setSharing(nextSharing);
    commit({ kind, city, country, until, month, sharing: nextSharing });
  }

  // The current status as a plain TravelStatus, for preview purposes -- doesn't
  // wait for a city the way commit() does, so the picker always reflects what's typed.
  const previewStatus: TravelStatus =
    kind === 'home'
      ? { kind: 'home' }
      : kind === 'traveling'
        ? { kind: 'traveling', city: city ?? '', country: country ?? '', until: until || undefined }
        : { kind: 'planning', city: city ?? '', country: country ?? '', month: month || undefined };

  const closeFriendsPreview = formatStatusText(trimStatusForLevel(previewStatus, sharing.closeFriends));
  const everyonePreview = formatStatusText(trimStatusForLevel(previewStatus, sharing.everyone));

  return (
    <EditPanelSheet visible={visible} title="Status" onClose={onClose}>
      <View style={styles.kindRow}>
        {(['home', 'traveling', 'planning'] as const).map((option) => (
          <Pressable
            key={option}
            style={[styles.kindButton, kind === option && styles.kindButtonActive]}
            onPress={() => handleKindChange(option)}
          >
            <Text style={[styles.kindLabel, kind === option && styles.kindLabelActive]}>
              {option === 'home' ? 'Home' : option === 'traveling' ? 'Traveling' : 'Planning'}
            </Text>
          </Pressable>
        ))}
      </View>

      {kind !== 'home' && (
        <>
          <Pressable style={styles.fieldRow} onPress={() => setIsCityPickerOpen(true)}>
            <Text style={styles.fieldLabel}>City</Text>
            <Text style={styles.fieldValue}>{city ? `${city}, ${country}` : 'Choose a city ›'}</Text>
          </Pressable>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{kind === 'traveling' ? 'Until' : 'When'}</Text>
            <TextInput
              style={styles.dateInput}
              value={kind === 'traveling' ? until : month}
              onChangeText={handleDateChange}
              placeholder={kind === 'traveling' ? 'YYYY-MM-DD (optional)' : 'YYYY-MM (optional)'}
            />
          </View>
        </>
      )}

      <View style={styles.boardingPass}>
        <View style={styles.boardingPassTop}>
          <Text style={styles.boardingPassKind}>
            {kind === 'home' ? '🏠 Home' : kind === 'traveling' ? '✈ Traveling' : '🗓 Planning'}
          </Text>
          {city && <Text style={styles.boardingPassCity}>{city}, {country}</Text>}
        </View>

        <View style={styles.perforation} />

        <View style={styles.boardingPassBottom}>
          <Text style={styles.seesLine}>Close friends see: {closeFriendsPreview ?? 'Nothing'}</Text>
          <Text style={styles.seesLine}>Everyone sees: {everyonePreview ?? 'Nothing'}</Text>
        </View>
      </View>

      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>Who sees this</Text>
        <Pressable onPress={() => router.push('/settings/close-friends')}>
          <Text style={styles.manageLink}>Manage close friends ›</Text>
        </Pressable>
      </View>

      {(['closeFriends', 'everyone'] as const).map((audience) => (
        <View key={audience} style={styles.sharingGroup}>
          <Text style={styles.sharingGroupLabel}>{audience === 'closeFriends' ? 'Close friends' : 'Everyone else'}</Text>
          <View style={styles.sharingOptionsRow}>
            {SHARING_OPTIONS.map((option) => (
              <Pressable
                key={option.level}
                style={[styles.sharingOption, sharing[audience] === option.level && styles.sharingOptionActive]}
                onPress={() => handleSharingChange(audience, option.level)}
              >
                <Text style={[styles.sharingOptionLabel, sharing[audience] === option.level && styles.sharingOptionLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sharingPreview}>
            They see: {audience === 'closeFriends' ? (closeFriendsPreview ?? 'Nothing') : (everyonePreview ?? 'Nothing')}
          </Text>
        </View>
      ))}

      <EditCityPanel
        visible={isCityPickerOpen}
        title="City"
        onSelect={handleCitySelect}
        onClose={() => setIsCityPickerOpen(false)}
      />
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  kindRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kindButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  kindButtonActive: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  kindLabel: {
    fontWeight: '600',
  },
  kindLabelActive: {
    color: '#fff',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#888',
  },
  fieldValue: {
    fontSize: 15,
  },
  dateInput: {
    fontSize: 15,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  boardingPass: {
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  boardingPassTop: {
    backgroundColor: '#f4f7f6',
    padding: 16,
    gap: 4,
  },
  boardingPassKind: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boardingPassCity: {
    fontSize: 14,
    color: '#555',
  },
  perforation: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#ccc',
  },
  boardingPassBottom: {
    padding: 16,
    gap: 4,
  },
  seesLine: {
    fontSize: 13,
    color: '#666',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  manageLink: {
    fontSize: 12,
    color: '#2A9D8F',
    fontWeight: '600',
  },
  sharingGroup: {
    marginBottom: 16,
  },
  sharingGroupLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  sharingOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sharingOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  sharingOptionActive: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
  },
  sharingOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sharingOptionLabelActive: {
    color: '#fff',
  },
  sharingPreview: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
});
