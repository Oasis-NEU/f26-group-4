// Gives the app's local storage to Supabase, so you stay signed in after the app restarts.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// The one Supabase client the whole app shares. Services import it to run queries;
// UserContextProvider (@/hooks/use-user) uses it to sign in and out.
// Both values come from .env.local (see "Connecting to Supabase" in the README). They're safe
// to ship in the app. Never put the secret key here, because it skips row level security.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// False until both values are set. The app still runs without them, so screens on mock data
// keep working, but signing in shows an error instead.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not set up, so signing in won\'t work. See "Connecting to Supabase" in the README.',
  );
}

// Until it's set up, the client points at a `.invalid` address, which never exists,
// so nothing gets sent anywhere.
export const supabase = createClient(
  supabaseUrl || 'https://supabase-not-set-up.invalid',
  supabasePublishableKey || 'not-set-up',
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Only matters on the web. Phones don't get the session back in a URL.
      detectSessionInUrl: false,
    },
  },
);

// Only refresh the sign-in token while the app is open, so it doesn't run in the background.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
