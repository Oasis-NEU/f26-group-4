import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';

// Cover photo panel: Auto (default), My own, or No cover. "My own" uploads
// through expo-image-picker, same approach as upload-media-picker.tsx.
// NOTE: whether users can upload their own cover is still an open question
// per the plan -- this builds the option so it's ready, but check with the
// group before it ships for real.

type CoverMode = 'auto' | 'custom' | 'none';

type EditCoverPanelProps = {
  visible: boolean;
  onClose: () => void;
  coverMode: CoverMode;
  coverImage?: string;
  onChange: (mode: CoverMode, image?: string) => void;
};

const OPTIONS: { mode: CoverMode; label: string; description: string }[] = [
  { mode: 'auto', label: 'Auto', description: 'The city you’re in now, or your dream trip' },
  { mode: 'custom', label: 'My own', description: 'Upload a photo' },
  { mode: 'none', label: 'No cover', description: 'No banner at the top of your profile' },
];

export function EditCoverPanel({ visible, onClose, coverMode, coverImage, onChange }: EditCoverPanelProps) {
  const [message, setMessage] = useState('');

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
      onChange('custom', result.assets[0].uri);
    } catch {
      setMessage('Could not open the photo picker. Please try again.');
    }
  }

  return (
    <EditPanelSheet visible={visible} title="Cover photo" onClose={onClose}>
      {OPTIONS.map((option) => (
        <Pressable
          key={option.mode}
          style={styles.row}
          onPress={() => (option.mode === 'custom' ? pickImage() : onChange(option.mode))}
        >
          <View style={styles.radio}>{coverMode === option.mode && <View style={styles.radioDot} />}</View>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{option.label}</Text>
            <Text style={styles.rowDescription}>{option.description}</Text>
          </View>
        </Pressable>
      ))}

      {coverMode === 'custom' && coverImage && (
        <View style={styles.previewRow}>
          <Image source={{ uri: coverImage }} style={styles.preview} />
          <Pressable onPress={pickImage}>
            <Text style={styles.changeLink}>Change photo</Text>
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
});
