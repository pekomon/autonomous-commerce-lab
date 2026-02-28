import { toFriendlyAuthErrorMessage } from '@autonomous-commerce-lab/shared';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useSupabase } from '../lib/SupabaseContext';

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { client } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!client) {
      setSession(null);
      setLoading(false);
      return;
    }

    void client.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      loading,
      session,
      user: session?.user ?? null,
      signInWithPassword: async (email, password) => {
        if (!client) {
          return 'Storefront configuration is missing.';
        }

        const { error } = await client.auth.signInWithPassword({ email, password });
        return error ? toFriendlyAuthErrorMessage(error, 'signIn') : null;
      },
      signUpWithPassword: async (email, password) => {
        if (!client) {
          return 'Storefront configuration is missing.';
        }

        const { error } = await client.auth.signUp({ email, password });
        return error ? toFriendlyAuthErrorMessage(error, 'signUp') : null;
      },
      signOut: async () => {
        if (!client) {
          return 'Storefront configuration is missing.';
        }

        const { error } = await client.auth.signOut();
        return error ? toFriendlyAuthErrorMessage(error, 'signOut') : null;
      },
    };
  }, [client, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
