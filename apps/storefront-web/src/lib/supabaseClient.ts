import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../data/database.types';
import type { RuntimeSupabaseConfig } from './runtimeConfig';

export type StorefrontSupabaseClient = SupabaseClient<Database>;

export interface SupabaseClientState {
  client: StorefrontSupabaseClient | null;
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
    client: createClient<Database>(config.supabaseUrl, config.supabaseAnonKey),
    configError: null,
  };
}
