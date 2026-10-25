import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// Profile tab: the logged-in user's own profile.
// Pieces to build it from:
//   Components: ProfileHeader (@/components/profile-header), ProfileInterests, ProfilePosts
//   Types: Profile (@/types/profile)
export default function ProfilePage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Not built yet. This page lives in src/app/(tabs)/profile.tsx.</Text>

      {/* Temporary, so the login page can be reached until signing in is set up. */}
      <Link href="/login" style={styles.link}>
        Go to login
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  link: {
    marginTop: 20,
    color: '#0066CC',
    fontSize: 16,
  },
});
