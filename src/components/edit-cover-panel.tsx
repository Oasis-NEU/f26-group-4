import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';
import { useDestinationPhotos } from '@/hooks/use-cities';

// Cover photo panel: Auto (default), Dream trip, My own, or No cover. "My
// own" uploads through expo-image-picker, same approach as
// upload-media-picker.tsx. "Dream trip" fetches a few real photos of your
// dream trip city from Pixabay (the destination-photo Edge Function) and
// lets you pick one -- which becomes a 'custom' cover, same as "My own".
// Both save as the exact same cover_mode, so `coverIsDreamTrip` (a real
// column, Profile.coverIsDreamTrip) is the only way to know which radio to
// light up, and the only way edit-profile.tsx knows to send you back here
// when the dream trip city changes.
// NOTE: whether users can upload their own cover is still an open question
// per the plan -- this builds the option so it's ready, but check with the
// group before it ships for real.

type CoverMode = 'auto' | 'custom' | 'none';

type EditCoverPanelProps = {
  visible: boolean;
  onClose: () => void;
  coverMode: CoverMode;
  coverImage?: string;
  coverIsDreamTrip: boolean;
  dreamTripCityId?: string;
  dreamTripCityName?: string;
  onChange: (mode: CoverMode, image?: string, isDreamTrip?: boolean) => void;
};

const OPTIONS: { mode: CoverMode | 'dreamTrip'; label: string; description: string }[] = [
  { mode: 'auto', label: 'Auto', description: 'The city you’re in now' },
  { mode: 'dreamTrip', label: 'Dream trip', description: 'A real photo of your dream trip city' },
  { mode: 'custom', label: 'My own', description: 'Upload a photo' },
  { mode: 'none', label: 'No cover', description: 'No banner at the top of your profile' },
];

export function EditCoverPanel({
  visible,
  onClose,
  coverMode,
  coverImage,
  coverIsDreamTrip,
  dreamTripCityId,
  dreamTripCityName,
  onChange,
}: EditCoverPanelProps) {
  const [message, setMessage] = useState('');
  const [isDreamTripOpen, setIsDreamTripOpen] = useState(false);
  const photos = useDestinationPhotos(dreamTripCityId, isDreamTripOpen);

  async function pickImage() {
    setMessage('');
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setMessage('Please allow photo library access to choose a cover.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 1],
      });

      if (result.canceled) return;
      onChange('custom', result.assets[0].uri, false);
    } catch {
      setMessage('Could not open the photo picker. Please try again.');
    }
  }

  function pressOption(mode: CoverMode | 'dreamTrip') {
    setMessage('');
    if (mode === 'dreamTrip') {
      setIsDreamTripOpen((open) => !open);
      return;
    }
    setIsDreamTripOpen(false);
    if (mode === 'custom') {
      pickImage();
    } else {
      onChange(mode);
    }
  }

  function pickDreamTripPhoto(url: string) {
    setIsDreamTripOpen(false);
    onChange('custom', url, true);
  }

  function isSelected(mode: CoverMode | 'dreamTrip'): boolean {
    if (coverMode !== 'custom') return coverMode === mode;
    if (mode === 'dreamTrip') return coverIsDreamTrip;
    if (mode === 'custom') return !coverIsDreamTrip;
    return false;
  }

  return (
    <EditPanelSheet visible={visible} title="Cover photo" onClose={onClose}>
      {OPTIONS.map((option) => (
        <View key={option.mode}>
          <Pressable style={styles.row} onPress={() => pressOption(option.mode)}>
            <View style={styles.radio}>{isSelected(option.mode) && <View style={styles.radioDot} />}</View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{option.label}</Text>
              <Text style={styles.rowDescription}>{option.description}</Text>
            </View>
          </Pressable>

          {option.mode === 'dreamTrip' && isDreamTripOpen && (
            <View style={styles.dreamTripSection}>
              {!dreamTripCityId ? (
                <Text style={styles.hint}>Set a dream trip city first, under Dream trip below.</Text>
              ) : photos.isPending ? (
                <ActivityIndicator />
              ) : photos.isError || photos.data?.length === 0 ? (
                <Text style={styles.hint}>
                  Couldn&apos;t find photos{dreamTripCityName ? ` of ${dreamTripCityName}` : ''}. Try again later.
                </Text>
              ) : (
                <View style={styles.photoRow}>
                  {photos.data?.map((url) => (
                    <Pressable key={url} onPress={() => pickDreamTripPhoto(url)}>
                      <Image source={{ uri: url }} style={styles.photoOption} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      ))}

      {coverMode === 'custom' && coverImage && (
        <View style={styles.previewRow}>
          <Image source={{ uri: coverImage }} style={styles.preview} />
          <Pressable onPress={pickImage}>
            <Text style={styles.changeLink}>Upload a different photo</Text>
          </Pressable>
        </View>
      )}

      {!!message && <Text style={styles.message}>{message}</Text>}
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2A9D8F',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    fontSize: 13,
    color: '#888',
  },
  dreamTripSection: {
    paddingBottom: 12,
    paddingLeft: 32,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photoOption: {
    width: 90,
    height: 60,
    borderRadius: 8,
  },
  previewRow: {
    marginTop: 8,
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    width: '100%',
    aspectRatio: 3,
    borderRadius: 12,
  },
  changeLink: {
    color: '#2A9D8F',
    fontWeight: '600',
  },
  message: {
    marginTop: 8,
    color: '#e53e3e',
    fontSize: 13,
  },
  hint: {
    color: '#888',
    fontSize: 13,
  },
});
