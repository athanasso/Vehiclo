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
import { supabase } from '../utils/supabase';

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

  // Map Supabase User to our User type
  const mapSupabaseUser = (sbUser: any): User => ({
    id: sbUser.id,
    email: sbUser.email,
    name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0],
    isGuest: false,
    provider: 'email',
  });

  // Check for existing session or guest data on app start
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        // 1. Check true auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          if (mounted) {
            setUser(mapSupabaseUser(session.user));
            setStatus('authenticated');
          }
          return;
        }

        // 2. Fallback to Guest
        const savedUser = await getData<User>(AUTH_KEY);
        if (savedUser && savedUser.isGuest) {
          if (mounted) {
            setUser(savedUser);
            setStatus('authenticated');
          }
          return;
        }
        
        // 3. No auth at all
        if (mounted) setStatus('unauthenticated');
      } catch (err) {
        console.warn('Auth init error:', err);
        if (mounted) setStatus('unauthenticated');
      }
    }

    initAuth();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        await removeData(AUTH_KEY); // wipe guest data when logging in
        setUser(mapSupabaseUser(session.user));
        setStatus('authenticated');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus('unauthenticated');
      throw error;
    }
    // state will update via onAuthStateChange
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    setStatus('loading');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus('unauthenticated');
      throw error;
    }
    // state will update via onAuthStateChange
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Basic OAuth setup — depends on platform (expo-auth-session usually needed for real mobile google oauth)
    // For simplicity, we trigger standard supabase flow which works best on web.
    // On native, this requires configuring deeply linked AuthSession.
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setStatus('loading');
    await removeData(AUTH_KEY);
    await supabase.auth.signOut();
    // state will update via onAuthStateChange
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
