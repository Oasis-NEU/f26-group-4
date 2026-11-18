import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '@/theme';
import type { Review } from '@/types/review';

const previewLength = 100;

type ReviewPhotoViewerProps = {
  reviews: Review[];
  initialReviewId: string;
  onClose: () => void;
};

export function ReviewPhotoViewer({ reviews, initialReviewId, onClose }: ReviewPhotoViewerProps) {
  const frames = reviews.flatMap((review) => {
    const photos = review.media.filter((item) => item.type === 'photo' && item.url.trim());
    return photos.map((photo) => ({ review, photo }));
  });
  const [index, setIndex] = useState(() => Math.max(0, frames.findIndex(({ review }) => review.id === initialReviewId)));
  const [readMore, setReadMore] = useState(false);
  const { height } = useWindowDimensions();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const currentIndex = Math.min(index, frames.length - 1);
  const current = frames[currentIndex];

  if (!current) return null;

  const text = current.review.reviewText?.trim() ?? '';
  const summary = text.replace(/\s+/g, ' ');
  const hasMore = summary.length > previewLength;
  const preview = hasMore ? `${summary.slice(0, previewLength).trimEnd()}…` : summary;

  function goToPhoto(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= frames.length) return;
    if (frames[nextIndex].review.id !== current.review.id) setReadMore(false);
    setIndex(nextIndex);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[styles.panel, { height: Math.min(620, height * 0.8) }]} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text
              numberOfLines={1}
              style={styles.author}
              accessibilityRole="link"
              onPress={() => {
                if (!current.review.authorId) return;
                onClose();
                router.push({ pathname: '/user/[id]', params: { id: current.review.authorId } });
              }}
            >{current.review.profileName}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close photo viewer" style={styles.button} onPress={onClose}>
              <Text style={styles.icon}>×</Text>
            </Pressable>
          </View>

          <View style={styles.photoRow}>
            {frames.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous photo"
                disabled={currentIndex === 0}
                style={[styles.button, currentIndex === 0 && styles.disabled]}
                onPress={() => goToPhoto(currentIndex - 1)}
              >
                <Text style={styles.icon}>‹</Text>
              </Pressable>
            )}

            <View
              style={styles.photoFrame}
              onTouchStart={({ nativeEvent }) => {
                touchStart.current = nativeEvent.touches.length === 1
                  ? { x: nativeEvent.pageX, y: nativeEvent.pageY }
                  : null;
              }}
              onTouchCancel={() => { touchStart.current = null; }}
              onTouchEnd={({ nativeEvent }) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (!start) return;

                const dx = nativeEvent.pageX - start.x;
                const dy = nativeEvent.pageY - start.y;
                if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy)) {
                  goToPhoto(currentIndex + (dx < 0 ? 1 : -1));
                }
              }}
            >
              <Image
                source={{ uri: current.photo.url }}
                recyclingKey={current.photo.url}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                accessible
                accessibilityLabel={current.photo.caption?.trim() || `Photo by ${current.review.profileName}`}
              />
            </View>

            {frames.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next photo"
                disabled={currentIndex === frames.length - 1}
                style={[styles.button, currentIndex === frames.length - 1 && styles.disabled]}
                onPress={() => goToPhoto(currentIndex + 1)}
              >
                <Text style={styles.icon}>›</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.caption}>
            {readMore ? (
              <ScrollView style={styles.fullText}>
                <Text style={styles.text}>{text}</Text>
              </ScrollView>
            ) : !!preview && <Text style={styles.text}>{preview}</Text>}
  
            {hasMore && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: readMore }}
                onPress={() => setReadMore(!readMore)}
                style={styles.readMore}
              >
                <Text style={[styles.text, styles.link]}>{readMore ? 'Read less' : 'Read more'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  panel: {
    width: '100%',
    maxWidth: 760,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  author: { flex: 1, color: colors.text, fontSize: type.heading, fontWeight: '700' },
  text: { color: colors.text, fontSize: type.body, lineHeight: spacing.xl },
  caption: { paddingTop: spacing.sm },
  fullText: { maxHeight: 140, flexGrow: 0 },
  readMore: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  link: { textDecorationLine: 'underline', fontWeight: '600' },
  photoRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  photoFrame: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.fill,
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: colors.text, fontSize: type.screenTitle },
  disabled: { opacity: 0.3 },
});
