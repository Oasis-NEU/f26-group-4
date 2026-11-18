import { useState } from 'react';
import {
  ActivityIndicator,
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

import { Button } from '@/components/ui';
import { colors, spacing, type } from '@/theme';
import type { Comment } from '@/types/comment';

// A popup listing every comment on a post, with a box at the bottom to write a new one.
// It doesn't load or save anything itself; the parent passes in the comments and
// saves what's posted.

// The database refuses longer comments
const MAX_COMMENT_LENGTH = 1000;

type CommentsModalProps = {
  visible: boolean;
  comments: Comment[] | undefined; // undefined until they've loaded
  isLoading?: boolean;
  isError?: boolean; // loading them failed
  onRetry?: () => void;
  // Saves the comment. The box empties straight away, and gets the text back if
  // the promise rejects.
  onPost: (text: string) => Promise<unknown>;
  onClose: () => void;
};

export function CommentsModal({ visible, comments, isLoading, isError, onRetry, onPost, onClose }: CommentsModalProps) {
  const [draft, setDraft] = useState('');
  const [postFailed, setPostFailed] = useState(false);
  const canPost = draft.trim().length > 0;

  function post() {
    if (!canPost) return;
    const text = draft.trim();
    setDraft('');
    setPostFailed(false);
    onPost(text).catch(() => {
      // Put the comment back, unless they've started typing another one
      setDraft((current) => current || text);
      setPostFailed(true);
    });
  }

  let empty = <Text style={styles.empty}>No comments yet</Text>;
  if (isLoading) {
    empty = <ActivityIndicator style={styles.status} />;
  } else if (isError) {
    empty = (
      <View style={styles.errorState}>
        <Text style={styles.empty}>Couldn&apos;t load the comments.</Text>
        <Button label="Try again" variant="secondary" align="center" onPress={onRetry} />
      </View>
    );
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
          ListEmptyComponent={empty}
        />
        {postFailed && <Text style={styles.postError}>Couldn&apos;t post your comment. Try again.</Text>}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              setPostFailed(false);
            }}
            maxLength={MAX_COMMENT_LENGTH}
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
  status: {
    paddingVertical: spacing.xl,
  },
  errorState: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  postError: {
    color: colors.textMuted,
    fontSize: type.small,
    paddingTop: spacing.sm,
  },
});
