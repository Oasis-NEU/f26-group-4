import Constants from 'expo-constants';

// The backend's address. Phones can't reach "localhost" on your computer, so this uses your
// computer's network address (the same one Expo uses). Set EXPO_PUBLIC_API_URL to override it.
const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:4000`;
