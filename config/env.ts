/**
 * Centralized Application Configuration & Environment Validation
 * Validates process.env variables at runtime with sensible defaults.
 */

export interface AppConfig {
  port: number;
  appEnv: 'development' | 'staging' | 'production';
  geminiApiKey: string | null;
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isAiConfigured: boolean;
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
  const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || null;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || null;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

  return Object.freeze({
    port,
    appEnv,
    geminiApiKey,
    supabaseUrl,
    supabaseAnonKey,
    isAiConfigured: Boolean(geminiApiKey && geminiApiKey.length > 0),
    isCloudSyncConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  });
}

export const env = loadConfig();
