import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

import type { SupabaseClientState } from './supabaseClient';

const SupabaseContext = createContext<SupabaseClientState>({
  client: null,
  configError: 'Storefront configuration is missing.',
});

interface SupabaseProviderProps {
  value: SupabaseClientState;
  children: ReactNode;
}

export function SupabaseProvider({ value, children }: SupabaseProviderProps) {
  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
