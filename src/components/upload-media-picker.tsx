import { useState } from 'react';
import {
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Media } from '@/types/media';
import { AuthInput } from './auth-input';

//This file lets someone pick real photos or videos, add captions, and remove items.

type UploadMediaPickerProps = {
  // Photos and videos currently selected.
  media: Media[];

  // Gives the updated list back to the upload page.
  onChange: (media: Media[]) => void;

  // Prevents changes while the post is being saved.
  disabled?: boolean;
};

export function UploadMediaPicker({
  media,
  onChange,
  disabled = false,
}: UploadMediaPickerProps) {
  const [message, setMessage] = useState('');
  const [isPicking, setIsPicking] = useState(false);

  async function pickMedia() {
    setMessage('');
    setIsPicking(true);

    try {
      // iOS may need library permission for original video files.
      if (Platform.OS === 'ios') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setMessage('Please allow photo library access to select videos.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
      });

      // Closing the picker without choosing anything is fine.
      if (result.canceled) {
        return;
      }

      const selectedMedia: Media[] = result.assets.map((file) => ({
        url: file.uri,
        caption: '',
        type: file.type === 'video' ? 'video' : 'photo',
      }));

      onChange([...media, ...selectedMedia]);
    } catch {
      setMessage('Could not open the media picker. Please try again.');
    } finally {
      setIsPicking(false);
    }
  }

  function removeMedia(indexToRemove: number) {
    onChange(media.filter((item, index) => index !== indexToRemove));
  }

  function changeCaption(indexToChange: number, caption: string) {
    onChange(
      media.map((item, index) =>
        index === indexToChange ? { ...item, caption } : item
      )
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Photos and videos</Text>

      <Button
        title={isPicking ? 'Opening picker…' : 'Add photos / videos'}
        onPress={pickMedia}
        disabled={disabled || isPicking}
      />

      <Text accessibilityLiveRegion="polite">{message}</Text>

      <ScrollView horizontal>
        {media.map((item, index) => (
          <View
            key={`${item.url}-${index}`}
            style={styles.card}
          >
            {item.type === 'video' ? (
              <View style={styles.video}>
                <Text>Video selected</Text>
              </View>
            ) : (
              <Image
                source={{ uri: item.url }}
                style={styles.image}
                accessibilityLabel={item.caption || 'Selected photo'}
              />
            )}

            {/* Prevent editing while posting or opening the picker. */}
            {disabled || isPicking ? (
              <Text>{item.caption}</Text>
            ) : (
              <AuthInput
                label="Caption"
                value={item.caption ?? ''}
                onChangeText={(text) => changeCaption(index, text)}
              />
            )}

            <Button
              title="Remove"
              onPress={() => removeMedia(index)}
              disabled={disabled || isPicking}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    width: 200,
    marginRight: 16,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  video: {
    width: 200,
    height: 150,
    backgroundColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
});