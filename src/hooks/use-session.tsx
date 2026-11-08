// Who's signed in. This is the app's only context (docs/data-layer.md, rule 5):
// everything else comes from services. Signing in or out flips the guards in
// src/app/_layout.tsx, which moves the app between Login and the tabs.
import type { User } from '@supabase/supabase-js';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type SignUpFields = { email: string; password: string; username: string; name: string };

type SessionValue = {
  user: User | null;
  // True until the saved session has been read, so the app doesn't flash Login.
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  // needsEmailConfirmation is true when the project asks new accounts to
  // confirm their email first. The shared dev project doesn't.
  signUp: (fields: SignUpFields) => Promise<{ needsEmailConfirmation: boolean }>;
  signInAsDemoUser: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Deletes the account for good (the delete-account Edge Function), then signs out.
  deleteAccount: () => Promise<void>;
};

// The demo sign-in buttons on Login. On for the demo build only: they use the
// shared demo password, which ends up inside the app.
export const DEMO_LOGINS_ENABLED = process.env.EXPO_PUBLIC_DEMO_LOGINS === 'true';

// Demo accounts all use <username>@example.com (supabase/seed/accounts.json).
const DEMO_EMAIL_DOMAIN = 'example.com';

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      isLoading,

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
      },

      async signUp({ email, password, username, name }) {
        // A database trigger makes the profile from username and name.
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { username: username.trim().toLowerCase(), name: name.trim() } },
        });
        if (error) throw error;
        return { needsEmailConfirmation: !data.session };
      },

      async signInAsDemoUser(username) {
        const password = process.env.EXPO_PUBLIC_DEMO_PASSWORD;
        if (!password) throw new Error('EXPO_PUBLIC_DEMO_PASSWORD is not set.');
        const { error } = await supabase.auth.signInWithPassword({
          email: `${username}@${DEMO_EMAIL_DOMAIN}`,
          password,
        });
        if (error) throw error;
      },

      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },

      async deleteAccount() {
        const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
        if (error) throw error;
        // The account is gone, so only this phone's copy of the session is left to clear.
        await supabase.auth.signOut({ scope: 'local' });
      },
    }),
    [user, isLoading],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession() must be used inside <SessionProvider>.');
  }
  return value;
}

// The signed-in user's id, for screens behind the login gate, which only exist
// while someone is signed in. It's empty only for the moment between signing
// out and the gate moving away.
export function useUserId(): string {
  return useSession().user?.id ?? '';
}
