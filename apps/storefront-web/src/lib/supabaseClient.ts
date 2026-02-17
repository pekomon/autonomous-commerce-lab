import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { RuntimeSupabaseConfig } from './runtimeConfig';

export interface SupabaseClientState {
  client: SupabaseClient | null;
  configError: string | null;
}

export function createSupabaseClientState(config: RuntimeSupabaseConfig): SupabaseClientState {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      client: null,
      configError:
        'Storefront configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local, or provide public/config.json values.',
    };
  }

  return {
    client: createClient(config.supabaseUrl, config.supabaseAnonKey),
    configError: null,
  };
}
