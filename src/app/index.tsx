import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oasis</Text>
      <Text style={styles.subtitle}>Choose a page to open</Text>

      <Link href="/upload" style={styles.link}>
        New post / Upload
      </Link>

      <Link href="/login" style={styles.link}>
        Login
      </Link>

      <Link href="/create-account" style={styles.link}>
        Create account
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F5EF',
    gap: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#213C32',
  },
  subtitle: {
    fontSize: 16,
    color: '#627269',
    marginBottom: 12,
  },
  link: {
    fontSize: 18,
    color: '#315D49',
    textDecorationLine: 'underline',
    padding: 12,
  },
});