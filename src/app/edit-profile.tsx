import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { DiscardChangesModal } from '@/components/discard-changes-modal';
import { EditBioPanel } from '@/components/edit-bio-panel';
import { EditCityPanel } from '@/components/edit-city-panel';
import { EditCoverPanel } from '@/components/edit-cover-panel';
import { EditInterestsPanel } from '@/components/edit-interests-panel';
import { EditNameUsernamePanel } from '@/components/edit-name-username-panel';
import { EditPhotoPanel } from '@/components/edit-photo-panel';
import { EditStatusPanel } from '@/components/edit-status-panel';
import { hasVisibleCover, ProfileCover } from '@/components/profile-cover';
import { useProfileCity } from '@/hooks/use-cities';
import { useInterestsByIds } from '@/hooks/use-interests';
import { useCheckUsername, useProfile, useUpdateProfile } from '@/hooks/use-profiles';
import { useUserId } from '@/hooks/use-session';
import { formatStatusText, trimStatusForLevel } from '@/utils/status-text';
import type { OwnTravelStatus, Profile, TravelStatus } from '@/types/profile';

// Edit profile: a modal route (see _layout.tsx) styled like the profile
// itself, with a ✎ on each part. Tapping one opens a panel for just that
// part; nothing saves until Save is tapped. It always edits the signed-in user's profile.

type PanelName = 'cover' | 'photo' | 'nameUsername' | 'homeCity' | 'dreamTrip' | 'status' | 'bio' | 'interests';

const USERNAME_PATTERN = /^[a-z0-9_.]{3,24}$/;

function isDraftValid(draft: Profile): boolean {
  if (!draft.name.trim() || draft.name.length > 40) return false;
  if (!USERNAME_PATTERN.test(draft.username)) return false;
  if ((draft.bio?.length ?? 0) > 150) return false;
  if (draft.interestIds.length < 1 || draft.interestIds.length > 6) return false;
  if (!draft.homeCityId) return false;
  return true;
}

// Only the fields that actually changed, so updateProfile gets a minimal patch.
function diffProfile(original: Profile, draft: Profile): Partial<Omit<Profile, 'id'>> {
  const changes: Partial<Record<keyof Profile, unknown>> = {};
  for (const key of Object.keys(draft) as (keyof Profile)[]) {
    if (key === 'id') continue;
    const draftValue = draft[key];
    if (JSON.stringify(draftValue) !== JSON.stringify(original[key])) {
      // draftValue always matches `key`'s own type, but TS can't verify that
      // generically across a heterogeneous object -- safe to assign as-is.
      changes[key] = draftValue;
    }
  }
  return changes as Partial<Omit<Profile, 'id'>>;
}

// The bits of a status ProfileCover/the status card need, regardless of kind.
function statusForPreview(status: TravelStatus): { kind: 'home' | 'traveling' | 'planning'; city?: string } {
  if (status.kind === 'home') return { kind: 'home' };
  return { kind: status.kind, city: status.city };
}

// Resolves interestIds to names for the Interests field's chip row.
function InterestChipRow({ ids }: { ids: string[] }) {
  const { data } = useInterestsByIds(ids);
  const names = (data ?? []).map((interest) => interest.name);

  if (names.length === 0) return <Text style={styles.fieldValue}>Pick 1-6 interests</Text>;

  return (
    <>
      {names.map((name) => (
        <View key={name} style={styles.chip}>
          <Text style={styles.chipText}>{name}</Text>
        </View>
      ))}
    </>
  );
}

export default function EditProfileScreen() {
  const userId = useUserId();
  const { data: profile, isError } = useProfile(userId);

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.loading}>{isError ? "Couldn't load your profile." : 'Loading…'}</Text>
      </SafeAreaView>
    );
  }

  // The form starts from the saved profile once it's loaded.
  return <EditProfileForm profile={profile} />;
}

function EditProfileForm({ profile }: { profile: Profile }) {
  // The edits so far. Only Save sends them.
  const [draft, setDraft] = useState<Profile>(profile);
  const [openPanel, setOpenPanel] = useState<PanelName | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const homeCity = useProfileCity(draft.homeCityId).data ?? null;
  const dreamTripCity = useProfileCity(draft.dreamTripCityId).data ?? null;
  const updateProfile = useUpdateProfile();
  const checkUsername = useCheckUsername();

  // Your own profile always has its status; "home" covers the moment before it loads.
  const status: OwnTravelStatus = draft.status ?? { kind: 'home', sharing: { closeFriends: 'full', everyone: 'country' } };
  const hasChanges = JSON.stringify(profile) !== JSON.stringify(draft);
  const canSave = hasChanges && isDraftValid(draft) && !isSaving;
  const showsCover = hasVisibleCover(draft.coverMode, draft.coverImage, statusForPreview(status), dreamTripCity?.name);

  function updateDraft(changes: Partial<Profile>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function handleCancel() {
    if (hasChanges) {
      setIsDiscardOpen(true);
    } else {
      router.back();
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError('');

    try {
      const available = await checkUsername(draft.username);
      if (!available) {
        setSaveError(`@${draft.username} is taken. Try another.`);
        setIsSaving(false);
        setOpenPanel('nameUsername');
        return;
      }

      await updateProfile.mutateAsync(diffProfile(profile, draft));
      router.back();
    } catch {
      setSaveError("Couldn't save your changes. Try again.");
      setIsSaving(false);
    }
  }

  const closeFriendsPreview = formatStatusText(trimStatusForLevel(status, status.sharing.closeFriends));
  const everyonePreview = formatStatusText(trimStatusForLevel(status, status.sharing.everyone));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={handleCancel}>
          <Text style={styles.topBarAction}>Cancel</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Edit profile</Text>
        <Pressable onPress={handleSave} disabled={!canSave}>
          <Text style={[styles.topBarAction, styles.saveAction, !canSave && styles.saveActionDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverWrapper}>
          <ProfileCover
            coverMode={draft.coverMode}
            coverImage={draft.coverImage}
            visibleStatus={statusForPreview(status)}
            dreamTrip={dreamTripCity?.name}
            isOwnProfile
            avatar={
              <Pressable style={styles.avatarPressable} onPress={() => setOpenPanel('photo')}>
                <Avatar
                  name={draft.name}
                  username={draft.username}
                  uri={draft.profilePicture}
                  userId={draft.id}
                  avatarHue={draft.avatarHue}
                  size={96}
                />
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraBadgeIcon}>📷</Text>
                </View>
              </Pressable>
            }
          />
          <Pressable style={[styles.coverEditButton, !showsCover && styles.coverEditButtonNoCover]} onPress={() => setOpenPanel('cover')}>
            <Text style={styles.editIconOnCover}>✎</Text>
          </Pressable>
        </View>

        <View style={[styles.content, showsCover && styles.contentWithCover]}>
          <View style={styles.nameRow}>
            <View>
              <Text style={styles.name}>{draft.name}</Text>
              <Text style={styles.username}>@{draft.username}</Text>
            </View>
            <Pressable onPress={() => setOpenPanel('nameUsername')}>
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
          </View>

          <Pressable style={styles.fieldCard} onPress={() => setOpenPanel('homeCity')}>
            <Text style={styles.fieldLabel}>Lives in</Text>
            <View style={styles.fieldValueRow}>
              <Text style={styles.fieldValue}>{homeCity ? `${homeCity.name}, ${homeCity.country}` : 'Choose a city'}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.fieldCard} onPress={() => setOpenPanel('dreamTrip')}>
            <Text style={styles.fieldLabel}>Dream trip</Text>
            <View style={styles.fieldValueRow}>
              <Text style={styles.fieldValue}>{dreamTripCity ? `${dreamTripCity.name}, ${dreamTripCity.country}` : 'Not set'}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>

          <Pressable style={styles.statusCard} onPress={() => setOpenPanel('status')}>
            <View style={styles.statusTopRow}>
              <Text style={styles.statusLabel}>
                {status.kind === 'home' ? '🏠 HOME' : status.kind === 'traveling' ? '✈ TRAVELING' : '🗓 PLANNING'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
            {status.kind !== 'home' && (
              <Text style={styles.statusCity}>
                {status.city}, {status.country}
              </Text>
            )}
            <View style={styles.perforation} />
            <Text style={styles.statusPreviewLine}>Close friends see: {closeFriendsPreview ?? 'Nothing'}</Text>
            <Text style={styles.statusPreviewLine}>Everyone sees: {everyonePreview ?? 'Nothing'}</Text>
          </Pressable>

          <View style={styles.bioCard}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>
                Bio <Text style={styles.counterText}>{draft.bio?.length ?? 0}/150</Text>
              </Text>
              <Pressable onPress={() => setOpenPanel('bio')}>
                <Text style={styles.editIcon}>✎</Text>
              </Pressable>
            </View>
            <Text style={styles.bioText}>{draft.bio || 'Add a bio'}</Text>
          </View>

          <Pressable style={styles.fieldCard} onPress={() => setOpenPanel('interests')}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>Interests</Text>
              <Text style={styles.editLink}>Edit ›</Text>
            </View>
            <View style={styles.chipRow}>
              <InterestChipRow ids={draft.interestIds} />
            </View>
          </Pressable>

          {!!saveError && <Text style={styles.saveError}>{saveError}</Text>}
        </View>
      </ScrollView>

      <EditCoverPanel
        visible={openPanel === 'cover'}
        onClose={() => setOpenPanel(null)}
        coverMode={draft.coverMode}
        coverImage={draft.coverImage}
        onChange={(mode, image) => updateDraft({ coverMode: mode, coverImage: image })}
      />

      <EditPhotoPanel
        visible={openPanel === 'photo'}
        onClose={() => setOpenPanel(null)}
        name={draft.name}
        username={draft.username}
        userId={draft.id}
        photoUrl={draft.profilePicture}
        avatarHue={draft.avatarHue}
        onChangePhoto={(uri) => updateDraft({ profilePicture: uri })}
        onChangeHue={(hue) => updateDraft({ avatarHue: hue })}
      />

      <EditNameUsernamePanel
        visible={openPanel === 'nameUsername'}
        onClose={() => setOpenPanel(null)}
        name={draft.name}
        username={draft.username}
        onChange={(name, username) => updateDraft({ name, username })}
      />

      <EditCityPanel
        visible={openPanel === 'homeCity'}
        title="Lives in"
        selectedCityId={draft.homeCityId}
        onSelect={(city) => updateDraft({ homeCityId: city.id })}
        onClose={() => setOpenPanel(null)}
      />

      <EditCityPanel
        visible={openPanel === 'dreamTrip'}
        title="Dream trip"
        selectedCityId={draft.dreamTripCityId}
        onSelect={(city) => updateDraft({ dreamTripCityId: city.id })}
        onClose={() => setOpenPanel(null)}
      />

      <EditStatusPanel
        visible={openPanel === 'status'}
        onClose={() => setOpenPanel(null)}
        status={status}
        onChange={(next) => updateDraft({ status: next })}
      />

      <EditBioPanel
        visible={openPanel === 'bio'}
        onClose={() => setOpenPanel(null)}
        bio={draft.bio ?? ''}
        onChange={(bio) => updateDraft({ bio })}
      />

      <EditInterestsPanel
        visible={openPanel === 'interests'}
        onClose={() => setOpenPanel(null)}
        userId={draft.id}
        selectedIds={draft.interestIds}
        onChange={(interestIds) => updateDraft({ interestIds })}
      />

      <DiscardChangesModal
        visible={isDiscardOpen}
        onDiscard={() => {
          setIsDiscardOpen(false);
          router.back();
        }}
        onKeepEditing={() => setIsDiscardOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    padding: 24,
    textAlign: 'center',
    color: 'gray',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBarAction: {
    fontSize: 15,
    color: '#555',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveAction: {
    color: '#2A9D8F',
    fontWeight: '700',
  },
  saveActionDisabled: {
    color: '#bbb',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverWrapper: {
    position: 'relative',
  },
  coverEditButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEditButtonNoCover: {
    backgroundColor: '#eee',
  },
  editIconOnCover: {
    color: '#fff',
    fontSize: 14,
  },
  avatarPressable: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeIcon: {
    fontSize: 13,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 14,
  },
  contentWithCover: {
    paddingTop: 72,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  username: {
    color: 'gray',
    textAlign: 'center',
  },
  editIcon: {
    fontSize: 16,
    color: '#555',
  },
  fieldCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  editLink: {
    fontSize: 13,
    color: '#2A9D8F',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 16,
    color: '#aaa',
  },
  statusCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
  },
  statusCity: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  perforation: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderTopColor: '#ddd',
    marginVertical: 10,
  },
  statusPreviewLine: {
    fontSize: 12,
    color: '#888',
  },
  bioCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  counterText: {
    color: '#aaa',
  },
  bioText: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  chipText: {
    fontSize: 12,
  },
  saveError: {
    color: '#e53e3e',
    fontSize: 13,
    textAlign: 'center',
  },
});
