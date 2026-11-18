import { router } from 'expo-router';
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

import { useAddReviewComment, useReviewComments } from '@/hooks/use-reviews';

type CommentsModalProps = {
  reviewId: string;
  onClose: () => void;
};

export function CommentsModal({ reviewId, onClose }: CommentsModalProps) {
  const [draft, setDraft] = useState('');
  const comments = useReviewComments(reviewId);
  const addComment = useAddReviewComment(reviewId);
  const canPost = draft.trim().length > 0 && !addComment.isPending;

  async function post() {
    if (!canPost) return;
    try {
      await addComment.mutateAsync(draft.trim());
      setDraft('');
    } catch {
      // Keep the draft so it can be retried. The mutation supplies the error state.
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
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
          data={comments.data ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.comment}
              accessibilityRole="link"
              accessibilityHint={`Opens ${item.author}’s profile`}
              disabled={!item.authorId}
              onPress={() => {
                if (!item.authorId) return;
                onClose();
                router.push({ pathname: '/user/[id]', params: { id: item.authorId } });
              }}
            >
              <Text>
                <Text style={styles.author}>{item.author} </Text>
                {item.text}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            comments.isPending ? (
              <Text style={styles.empty}>Loading comments…</Text>
            ) : comments.isError ? (
              <Pressable onPress={() => void comments.refetch()} accessibilityRole="button">
                <Text accessibilityRole="alert" style={styles.empty}>Couldn’t load comments. Tap to retry.</Text>
              </Pressable>
            ) : (
              <Text style={styles.empty}>No comments yet</Text>
            )
          }
        />
        {addComment.isError && (
          <Text accessibilityRole="alert" style={styles.empty}>Couldn’t post your comment. Try again.</Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={draft}
            maxLength={1000}
            editable={!addComment.isPending}
            onChangeText={setDraft}
            placeholder="Add a comment..."
            placeholderTextColor="#444"
            returnKeyType="send"
            onSubmitEditing={() => void post()}
            accessibilityLabel="Write a comment"
          />
          <Pressable
            onPress={() => void post()}
            disabled={!canPost}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            hitSlop={8}
          >
            <Text style={[styles.post, !canPost && styles.postDisabled]}>{addComment.isPending ? 'Posting…' : 'Post'}</Text>
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
