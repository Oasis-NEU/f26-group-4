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

type PhotoLocation = {
  latitude: number;
  longitude: number;
};

type UploadMediaPickerProps = {
  media: Media[];
  onChange: (media: Media[]) => void;
  onPhotoLocation?: (coordinates: PhotoLocation) => void;
  disabled?: boolean;
};

// Photos may store coordinates as decimals or degrees/minutes/seconds.
function toDecimal(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  if (Array.isArray(value) && value.length === 3) {
    const degrees = toDecimal(value[0]);
    const minutes = toDecimal(value[1]);
    const seconds = toDecimal(value[2]);

    if (
      degrees === undefined ||
      minutes === undefined ||
      seconds === undefined ||
      minutes < 0 ||
      minutes >= 60 ||
      seconds < 0 ||
      seconds >= 60
    ) {
      return undefined;
    }

    return (
      (degrees < 0 ? -1 : 1) *
      (Math.abs(degrees) + minutes / 60 + seconds / 3600)
    );
  }

  return undefined;
}

function getPhotoLocation(
  exif: Record<string, unknown> | null | undefined
): PhotoLocation | undefined {
  if (!exif) return undefined;

  // Some devices put GPS information inside a nested object.
  const nested = exif['{GPS}'];
  const gps =
    typeof nested === 'object' && nested !== null
      ? (nested as Record<string, unknown>)
      : exif;

  let latitude = toDecimal(gps.GPSLatitude ?? gps.Latitude);
  let longitude = toDecimal(gps.GPSLongitude ?? gps.Longitude);

  if (latitude === undefined || longitude === undefined) {
    return undefined;
  }

  const latitudeRef = gps.GPSLatitudeRef ?? gps.LatitudeRef;
  const longitudeRef = gps.GPSLongitudeRef ?? gps.LongitudeRef;

  if (typeof latitudeRef === 'string') {
    const ref = latitudeRef.toUpperCase();

    if (ref !== 'N' && ref !== 'S') return undefined;
    latitude = Math.abs(latitude) * (ref === 'S' ? -1 : 1);
  }

  if (typeof longitudeRef === 'string') {
    const ref = longitudeRef.toUpperCase();

    if (ref !== 'E' && ref !== 'W') return undefined;
    longitude = Math.abs(longitude) * (ref === 'W' ? -1 : 1);
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return undefined;
  }

  return { latitude, longitude };
}

export function UploadMediaPicker({
  media,
  onChange,
  onPhotoLocation,
  disabled = false,
}: UploadMediaPickerProps) {
  const [message, setMessage] = useState('');
  const [isPicking, setIsPicking] = useState(false);

  async function pickMedia() {
    setMessage('');
    setIsPicking(true);

    try {
      if (Platform.OS === 'ios') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setMessage(
            'Please allow photo library access to select photos and videos.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        exif: true,
      });

      if (result.canceled) return;

      const selectedMedia: Media[] = result.assets.map((file) => ({
        url: file.uri,
        caption: '',
        type: file.type === 'video' ? 'video' : 'photo',
      }));

      onChange([...media, ...selectedMedia]);

      let photoLocation: PhotoLocation | undefined;

      for (const file of result.assets) {
        if (file.type === 'video') continue;

        photoLocation = getPhotoLocation(file.exif);

        if (photoLocation) break;
      }

      if (photoLocation) {
        onPhotoLocation?.(photoLocation);
      } else {
        setMessage(
          Platform.OS === 'web'
            ? 'Photo location autofill is available in the mobile app. Enter the location below.'
            : 'No GPS data found in these photos. Enter the location below.'
        );
      }
    } catch {
      setMessage('Could not open the media picker. Please try again.');
    } finally {
      setIsPicking(false);
    }
  }

  function removeMedia(indexToRemove: number) {
    onChange(media.filter((_, index) => index !== indexToRemove));
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

      <Text accessibilityLiveRegion="polite" style={styles.message}>
        {message}
      </Text>

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
  message: {
    marginVertical: 8,
    lineHeight: 20,
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