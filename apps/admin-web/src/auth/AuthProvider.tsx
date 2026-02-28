import { toFriendlyAuthErrorMessage } from '@autonomous-commerce-lab/shared';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabaseClient';

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      loading,
      session,
      user: session?.user ?? null,
      signInWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? toFriendlyAuthErrorMessage(error, 'signIn') : null;
      },
      signUpWithPassword: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        return error ? toFriendlyAuthErrorMessage(error, 'signUp') : null;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return error ? toFriendlyAuthErrorMessage(error, 'signOut') : null;
      },
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
