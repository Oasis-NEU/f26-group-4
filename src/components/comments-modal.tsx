import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// A popup listing every comment on a place, with a box at the bottom to write a new one.
// It doesn't store anything itself; the parent passes in the comments and hears back
// what was posted.

export type Comment = {
  id: string;
  author: string;
  text: string;
};

type CommentsModalProps = {
  visible: boolean;
  comments: Comment[];
  onPost: (text: string) => void;
  onClose: () => void;
};

export function CommentsModal({ visible, comments, onPost, onClose }: CommentsModalProps) {
  const [draft, setDraft] = useState('');
  const canPost = draft.trim().length > 0;

  function post() {
    if (!canPost) return;
    onPost(draft.trim());
    setDraft('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <Text style={styles.author}>{item.author} </Text>
              {item.text}
            </Text>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment..."
            placeholderTextColor="#444"
            returnKeyType="send"
            onSubmitEditing={post}
            accessibilityLabel="Write a comment"
          />
          <Pressable
            onPress={post}
            disabled={!canPost}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            hitSlop={8}
          >
            <Text style={[styles.post, !canPost && styles.postDisabled]}>Post</Text>
          </Pressable>
        </View>
      </View>
      </KeyboardAvoidingView>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#111',
  },
  post: {
    fontWeight: 'bold',
    color: '#0095F6',
  },
  postDisabled: {
    opacity: 0.4,
  },
  empty: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
  },
});
