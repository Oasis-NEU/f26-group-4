import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { Avatar } from '@/components/avatar';
import { EditPanelSheet } from '@/components/edit-panel-sheet';

// Profile photo panel: take a photo, choose from the library, or remove the
// current one. When there's no photo, an "Initials color" row appears,
// collapsed by default -- tapping "Change" expands 8 presets + a hue strip
// and swaps the helper line for a "Done" link, matching the plan.
//
// NOTE: no slider library is installed, so "slide for any color" is a plain
// touch-and-drag strip (View responder events, no new dependency) instead of
// a native Slider component.

const PRESET_HUES = [0, 45, 90, 135, 180, 225, 270, 315];

type EditPhotoPanelProps = {
  visible: boolean;
  onClose: () => void;
  name: string;
  username: string;
  userId: string;
  photoUrl?: string;
  avatarHue?: number;
  onChangePhoto: (uri: string | undefined) => void; // undefined = removed
  onChangeHue: (hue: number | undefined) => void; // undefined = back to the userId-derived default
};

function hueFromTouch(event: GestureResponderEvent, width: number): number {
  const x = Math.max(0, Math.min(event.nativeEvent.locationX, width));
  return Math.round((x / width) * 359);
}

export function EditPhotoPanel({
  visible,
  onClose,
  name,
  username,
  userId,
  photoUrl,
  avatarHue,
  onChangePhoto,
  onChangeHue,
}: EditPhotoPanelProps) {
  const [message, setMessage] = useState('');
  const [isColorExpanded, setIsColorExpanded] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(0);

  async function takePhoto() {
    setMessage('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage('Please allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) onChangePhoto(result.assets[0].uri);
  }

  async function chooseFromLibrary() {
    setMessage('');
    if (Platform.OS === 'ios') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessage('Please allow photo library access to choose a photo.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) onChangePhoto(result.assets[0].uri);
  }

  function removePhoto() {
    onChangePhoto(undefined);
    setIsColorExpanded(false); // panel stays open, color picker starts collapsed again
  }

  function handleSliderTouch(event: GestureResponderEvent) {
    if (sliderWidth === 0) return;
    onChangeHue(hueFromTouch(event, sliderWidth));
  }

  return (
    <EditPanelSheet visible={visible} title="Profile photo" onClose={onClose}>
      <View style={styles.previewRow}>
        <Avatar name={name} username={username} uri={photoUrl} userId={userId} avatarHue={avatarHue} size={84} />
      </View>

      <Pressable style={styles.optionRow} onPress={takePhoto}>
        <Text style={styles.optionLabel}>Take a photo</Text>
      </Pressable>
      <Pressable style={styles.optionRow} onPress={chooseFromLibrary}>
        <Text style={styles.optionLabel}>Choose from library</Text>
      </Pressable>
      {photoUrl && (
        <Pressable style={styles.optionRow} onPress={removePhoto}>
          <Text style={[styles.optionLabel, styles.removeLabel]}>Remove photo</Text>
        </Pressable>
      )}

      {!!message && <Text style={styles.message}>{message}</Text>}

      {!photoUrl && (
        <View style={styles.colorSection}>
          <View style={styles.colorSummaryRow}>
            <Avatar name={name} username={username} userId={userId} avatarHue={avatarHue} size={32} />
            <Text style={styles.colorSummaryLabel}>Initials color</Text>
            <Pressable onPress={() => setIsColorExpanded((current) => !current)}>
              <Text style={styles.changeLink}>{isColorExpanded ? 'Done' : 'Change'}</Text>
            </Pressable>
          </View>

          {isColorExpanded ? (
            <View style={styles.colorExpanded}>
              <View style={styles.presetRow}>
                {PRESET_HUES.map((hue) => (
                  <Pressable
                    key={hue}
                    onPress={() => onChangeHue(hue)}
                    style={[
                      styles.preset,
                      { backgroundColor: `hsl(${hue}, 55%, 86%)` },
                      avatarHue === hue && styles.presetSelected,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.sliderLabel}>Or slide for any color</Text>
              <View
                style={styles.sliderTrack}
                onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleSliderTouch}
                onResponderMove={handleSliderTouch}
              >
                {Array.from({ length: 36 }, (_, i) => i * 10).map((hue) => (
                  <View key={hue} style={[styles.sliderSegment, { backgroundColor: `hsl(${hue}, 55%, 70%)` }]} />
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.helperText}>Add a photo so friends can recognize you.</Text>
          )}
        </View>
      )}
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  previewRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionLabel: {
    fontSize: 15,
  },
  removeLabel: {
    color: '#e53e3e',
  },
  message: {
    marginTop: 8,
    color: '#e53e3e',
    fontSize: 13,
  },
  colorSection: {
    marginTop: 16,
  },
  colorSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorSummaryLabel: {
    flex: 1,
    fontSize: 14,
  },
  changeLink: {
    color: '#2A9D8F',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
  colorExpanded: {
    marginTop: 12,
    gap: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  preset: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetSelected: {
    borderColor: '#333',
  },
  sliderLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sliderTrack: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sliderSegment: {
    flex: 1,
  },
});
