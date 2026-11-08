// The one Supabase client. Only files in src/services/ and the session hook
// (src/hooks/use-session.tsx) may import it (docs/data-layer.md, rule 3).
//
// The URL and publishable key come from .env (the shared project) or
// .env.local (the local stack, which wins when it exists). The publishable key
// is meant to ship in the app: row level security is what protects the data.
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { authStorage } from '@/lib/auth-storage';
import type { Database } from '@/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set in .env (see docs/backend-plan.md).',
  );
}

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh the sign-in token while the app is open.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// The signed-in user's id, for services. Services never take it as an
// argument (docs/data-layer.md, rule 9).
export async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) {
    throw new Error('Not signed in.');
  }
  return id;
}
