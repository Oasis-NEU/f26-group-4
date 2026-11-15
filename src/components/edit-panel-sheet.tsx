import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// The sheet shell every Edit profile panel (cover, photo, name, status, bio,
// interests...) is built on, so they share one look instead of seven slightly
// different ones. "Done" just closes the panel -- it never saves; Save lives
// on the Edit profile screen's top bar.
//
// NOTE: this is a plain Modal, not a real drag-to-resize bottom sheet (no
// @gorhom/bottom-sheet yet -- see the Edit profile plan's note to check with
// the group before adding it). The bar at the top is decorative, not a
// working drag handle.

type EditPanelSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function EditPanelSheet({ visible, title, onClose, children }: EditPanelSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  done: {
    color: '#2A9D8F',
    fontWeight: '600',
    fontSize: 15,
  },
});
