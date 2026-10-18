import { Link } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import {PlaceDetails} from "@/app/place";
import {mockPlace} from "@/types/place";

export default function Index() {
  return (
    <View style={styles.container}>
      <PlaceDetails place={mockPlace} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
