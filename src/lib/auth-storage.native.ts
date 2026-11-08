// Where the sign-in session is kept on iOS and Android, so people stay signed
// in after the app closes. expo-sqlite's localStorage, as in Expo's Supabase
// guide. The web uses auth-storage.ts instead, so the web bundle never loads
// expo-sqlite.
import 'expo-sqlite/localStorage/install';

export const authStorage: Storage = localStorage;
