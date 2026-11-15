import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// Shown when Cancel is tapped on Edit profile with unsaved changes.

type DiscardChangesModalProps = {
  visible: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
};

export function DiscardChangesModal({ visible, onDiscard, onKeepEditing }: DiscardChangesModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <Pressable style={styles.backdrop} onPress={onKeepEditing} />
      <View style={styles.card}>
        <Text style={styles.title}>Discard changes?</Text>
        <Text style={styles.message}>If you leave now, your edits won&apos;t be saved.</Text>
        <Pressable style={styles.discardButton} onPress={onDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </Pressable>
        <Pressable style={styles.keepButton} onPress={onKeepEditing}>
          <Text style={styles.keepText}>Keep editing</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  card: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: '35%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  discardButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
  },
  discardText: {
    color: '#fff',
    fontWeight: '600',
  },
  keepButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  keepText: {
    fontWeight: '600',
  },
});
