import { StyleSheet, Text, TextInput, View } from 'react-native';

import { EditPanelSheet } from '@/components/edit-panel-sheet';

const MAX_LENGTH = 150;

type EditBioPanelProps = {
  visible: boolean;
  onClose: () => void;
  bio: string;
  onChange: (bio: string) => void;
};

export function EditBioPanel({ visible, onClose, bio, onChange }: EditBioPanelProps) {
  return (
    <EditPanelSheet visible={visible} title="Bio" onClose={onClose}>
      <Text style={styles.prompt}>What should people know about how you travel?</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={(text) => onChange(text.slice(0, MAX_LENGTH))}
        placeholder="Tell people about your travel style..."
        multiline
        maxLength={MAX_LENGTH}
      />
      <View style={styles.counterRow}>
        <Text style={styles.counter}>
          {bio.length}/{MAX_LENGTH}
        </Text>
      </View>
    </EditPanelSheet>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  counter: {
    fontSize: 12,
    color: '#888',
  },
});
