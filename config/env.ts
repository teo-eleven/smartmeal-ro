/**
 * Centralized Application Configuration & Environment Validation
 * Validates process.env variables at runtime with sensible defaults.
 */

export interface AppConfig {
  port: number;
  appEnv: 'development' | 'staging' | 'production';
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  /**
   * AI is reachable only through the Supabase edge function, which keeps the provider key
   * server-side. A client-side key would be inlined into the shipped bundle by Expo and
   * readable by anyone using the app.
   */
  isAiProxyConfigured: boolean;
  isCloudSyncConfigured: boolean;
}

function parsePort(value: string | undefined, defaultPort: number): number {
  if (!value) return defaultPort;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(
      `[Config Error] Invalid EXPO_PUBLIC_PORT: "${value}". Must be a valid port number between 1 and 65535.`
    );
  }
  return parsed;
}

function parseAppEnv(value: string | undefined): 'development' | 'staging' | 'production' {
  if (!value) return 'development';
  if (value !== 'development' && value !== 'staging' && value !== 'production') {
    throw new Error(
      `[Config Error] Invalid EXPO_PUBLIC_APP_ENV: "${value}". Expected 'development', 'staging', or 'production'.`
    );
  }
  return value;
}

function loadConfig(): AppConfig {
  const port = parsePort(process.env.EXPO_PUBLIC_PORT, 8081);
  const appEnv = parseAppEnv(process.env.EXPO_PUBLIC_APP_ENV);
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

  return Object.freeze({
    port,
    appEnv,
    supabaseUrl,
    supabaseAnonKey,
    isAiProxyConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    isCloudSyncConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  });
}

export const env = loadConfig();
