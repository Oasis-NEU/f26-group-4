import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { isSupabaseConfigured, supabase } from '@/services/supabase';
import type { CreateAccountFields } from '@/types/create-account-fields';
import type { User } from '@/types/user';

// Who's signed in, shared with every screen. The root layout wraps the app in
// UserContextProvider, so any screen can call useUser() to read the user or sign in and out:
//
//   const { user, signIn, signOut } = useUser();
//
// Supabase Auth handles the email and password. The name and username come from the
// `profiles` table, which a database trigger fills in when an account is created
// (see supabase/migrations/).

// What signIn and signUp return: an error message to show, or null if it worked
type AuthResult = { error: string | null };

// What signIn and signUp return when .env.local doesn't have the Supabase values yet
const notSetUp: AuthResult = {
  error: 'Supabase isn\'t set up yet. See "Connecting to Supabase" in the README.',
};

// What useUser() returns
type UserContextValue = {
  // The signed-in user, or null if no one is signed in (or they're still loading)
  user: User | null;

  // Supabase's sign-in session (tokens and the raw account). Most screens only need `user`.
  session: Session | null;

  // True while the app looks for a saved session at launch, and while the profile loads
  // after signing in. Show a spinner instead of the login page while it's true.
  isLoading: boolean;

  // Supabase signs in with an email, not a username
  signIn: (email: string, password: string) => Promise<AuthResult>;

  // Creates the account. If "Confirm email" is on in Supabase, the person isn't signed in
  // until they tap the link in the email.
  signUp: (fields: Omit<CreateAccountFields, 'confirmPassword'>) => Promise<AuthResult>;

  signOut: () => Promise<void>;

  // Loads the name and username again, e.g. after Edit profile saves
  refreshUser: () => Promise<void>;
};

// The part of a `profiles` row the context keeps
type ProfileRow = Pick<User, 'id' | 'name' | 'username'>;

const UserContext = createContext<UserContextValue | null>(null);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Without Supabase there's no saved session to look for, so it's already checked
  const [hasCheckedSession, setHasCheckedSession] = useState(!isSupabaseConfigured);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // Supabase calls this right away with the saved session (or null), then again whenever
  // someone signs in or out or the token refreshes.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Don't await other Supabase calls in here, because it can deadlock.
      // The effect below loads the profile instead.
      setSession(newSession);
      setHasCheckedSession(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Load the profile whenever a different account signs in. It depends on the id, not the
  // session, so a token refresh (new session, same person) doesn't load it again.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;
    fetchProfile(userId).then((row) => {
      // Ignore the answer if someone else signed in while it loaded
      if (isCurrent) setProfile(row);
    });
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  // Only use the profile if it belongs to whoever is signed in now. After signing out
  // there's no session, so `user` becomes null without having to clear anything.
  const user: User | null =
    session && profile?.id === session.user.id
      ? { ...profile, email: session.user.email ?? '' }
      : null;

  const isLoading = !hasCheckedSession || (session !== null && user === null);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    if (!isSupabaseConfigured) return notSetUp;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp({
    email,
    password,
    name,
    username,
  }: Omit<CreateAccountFields, 'confirmPassword'>): Promise<AuthResult> {
    if (!isSupabaseConfigured) return notSetUp;

    // `data` is saved on the account, and the database trigger copies name and username
    // from it into the new `profiles` row. A taken username makes the trigger fail, which
    // Supabase reports as "Database error saving new user".
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, username } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshUser() {
    if (!userId) return;
    setProfile(await fetchProfile(userId));
  }

  return (
    <UserContext value={{ user, session, isLoading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </UserContext>
  );
}

// The signed-in user and the sign-in functions. Only works inside UserContextProvider.
export function useUser(): UserContextValue {
  const value = useContext(UserContext);
  if (!value) {
    throw new Error('useUser() must be called inside <UserContextProvider>.');
  }
  return value;
}

// An account's name and username. If the row is missing or the request fails, it warns and
// returns blanks, so the app doesn't stay stuck loading.
async function fetchProfile(id: string): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, username')
    .eq('id', id)
    .single();

  if (error) {
    console.warn(`Couldn't load the profile for ${id}: ${error.message}`);
  }
  return { id, name: data?.name ?? '', username: data?.username ?? '' };
}
