import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Review } from '@/types/review';

// A popup listing every comment on a place. The comments are the place's posts
// (each post's author and text) until the app has a separate comments service.

type CommentsModalProps = {
  visible: boolean;
  comments: Review[];
  onClose: () => void;
};

export function CommentsModal({ visible, comments, onClose }: CommentsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Comments</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Text style={styles.comment}>
              <Text style={styles.author}>{item.profileName} </Text>
              {item.reviewText}
            </Text>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '60%',
    minHeight: 200,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  close: {
    fontSize: 20,
  },
  comment: {
    paddingVertical: 8,
  },
  author: {
    fontWeight: 'bold',
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
