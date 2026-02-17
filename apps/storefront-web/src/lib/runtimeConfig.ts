export interface RuntimeSupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface RuntimeConfigFileShape {
  supabaseUrl?: unknown;
  supabaseAnonKey?: unknown;
}

function readStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseConfigFile(input: unknown): RuntimeSupabaseConfig {
  const parsed = (input ?? {}) as RuntimeConfigFileShape;

  return {
    supabaseUrl: readStringValue(parsed.supabaseUrl),
    supabaseAnonKey: readStringValue(parsed.supabaseAnonKey),
  };
}

export async function loadRuntimeSupabaseConfig(): Promise<RuntimeSupabaseConfig> {
  const envConfig: RuntimeSupabaseConfig = {
    supabaseUrl: readStringValue(import.meta.env.VITE_SUPABASE_URL),
    supabaseAnonKey: readStringValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
  };

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return envConfig;
    }

    const fileConfig = parseConfigFile(await response.json());

    return {
      supabaseUrl: fileConfig.supabaseUrl || envConfig.supabaseUrl,
      supabaseAnonKey: fileConfig.supabaseAnonKey || envConfig.supabaseAnonKey,
    };
  } catch {
    return envConfig;
  }
}
