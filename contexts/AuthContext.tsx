/**
 * Auth context — manages authentication state.
 * Currently supports guest mode. Ready for Supabase integration:
 * - Email/password login
 * - Google OAuth
 *
 * To integrate Supabase later:
 * 1. Install: npx expo install @supabase/supabase-js
 * 2. Create a supabase client in utils/supabase.ts
 * 3. Replace the guest logic here with supabase.auth methods
 * 4. Listen to onAuthStateChange to update user state
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { getData, setData, removeData } from '../utils/storage';

const AUTH_KEY = '@vehiclo_auth';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export interface User {
  id: string;
  email?: string;
  name?: string;
  isGuest: boolean;
  avatarUrl?: string;
  provider?: 'guest' | 'email' | 'google';
}

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  /** Sign in as guest (no account needed) */
  continueAsGuest: () => Promise<void>;
  /** Placeholder: Email/password sign in (Supabase) */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Placeholder: Email/password sign up (Supabase) */
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  /** Placeholder: Google OAuth sign in (Supabase) */
  signInWithGoogle: () => Promise<void>;
  /** Sign out and return to auth screen */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on app start
  useEffect(() => {
    (async () => {
      try {
        const savedUser = await getData<User>(AUTH_KEY);
        if (savedUser) {
          setUser(savedUser);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('unauthenticated');
      }
    })();
  }, []);

  const continueAsGuest = useCallback(async () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: 'Guest Driver',
      isGuest: true,
      provider: 'guest',
    };
    await setData(AUTH_KEY, guestUser);
    setUser(guestUser);
    setStatus('authenticated');
  }, []);

  // ── Supabase Placeholders ──────────────────────────────────
  // Replace these with real Supabase logic when integrating:
  //
  // import { supabase } from '../utils/supabase';
  //
  // const signInWithEmail = async (email, password) => {
  //   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  //   if (error) throw error;
  //   const user = { id: data.user.id, email, isGuest: false, provider: 'email' };
  //   await setData(AUTH_KEY, user);
  //   setUser(user);
  //   setStatus('authenticated');
  // };
  //
  // const signInWithGoogle = async () => {
  //   const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  //   // Handle OAuth redirect...
  // };

  const signInWithEmail = useCallback(async (email: string, _password: string) => {
    // TODO: Replace with Supabase auth
    const emailUser: User = {
      id: `email_${Date.now()}`,
      email,
      name: email.split('@')[0],
      isGuest: false,
      provider: 'email',
    };
    await setData(AUTH_KEY, emailUser);
    setUser(emailUser);
    setStatus('authenticated');
  }, []);

  const signUpWithEmail = useCallback(async (email: string, _password: string) => {
    // TODO: Replace with Supabase auth
    const emailUser: User = {
      id: `email_${Date.now()}`,
      email,
      name: email.split('@')[0],
      isGuest: false,
      provider: 'email',
    };
    await setData(AUTH_KEY, emailUser);
    setUser(emailUser);
    setStatus('authenticated');
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // TODO: Replace with Supabase Google OAuth
    const googleUser: User = {
      id: `google_${Date.now()}`,
      name: 'Google User',
      isGuest: false,
      provider: 'google',
    };
    await setData(AUTH_KEY, googleUser);
    setUser(googleUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    // TODO: Add supabase.auth.signOut() here
    await removeData(AUTH_KEY);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        continueAsGuest,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
