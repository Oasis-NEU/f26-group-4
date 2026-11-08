import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

// A generic "are you sure" dialog: friends-only on/off, log out, delete
// account. A plain Modal (not the OS Alert) so it renders consistently on
// web too. `destructive` makes the confirm button red (delete account, etc).

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable style={[styles.confirmButton, destructive && styles.destructiveButton]} onPress={onConfirm}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{cancelLabel}</Text>
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
    top: '32%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
    marginTop: 6,
    marginBottom: 16,
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2A9D8F',
    alignItems: 'center',
  },
  destructiveButton: {
    backgroundColor: '#e53e3e',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontWeight: '600',
  },
});
