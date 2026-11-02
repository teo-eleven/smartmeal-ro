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
  /**
   * Where the published privacy policy lives. Apple requires it to be reachable from inside
   * the app (5.1.1(i)), and consent at sign-up is only informed if it can be read there.
   * Required for a production build; see config/assertProductionEnv.js.
   */
  privacyPolicyUrl: string | null;
  /** Where the terms of use live; Apple 3.1.2 wants them linked from the subscription screen. */
  termsUrl: string | null;
  /**
   * RevenueCat's public SDK keys, one per store (appl_… and goog_…). Public by design, like
   * the Supabase anon key. The secret key never belongs here; see assertProductionEnv.js.
   */
  revenueCatIosKey: string | null;
  revenueCatAndroidKey: string | null;
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

/**
 * The Supabase URL is the base for every network call the app makes, so it has to be https.
 * A plain-http value would send the anon key and every saved plan in clear text, and on iOS
 * it would need an App Transport Security exception that App Review asks about.
 */
function parseHttpsUrl(
  value: string | undefined,
  name = 'EXPO_PUBLIC_SUPABASE_URL',
  consequence = 'Cloud features stay off.'
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (!/^https:\/\//i.test(trimmed)) {
    console.warn(`[env] ${name} must start with https://. ${consequence}`);
    return null;
  }
  return trimmed.replace(/\/+$/, '');
}

const LOCAL_DEV_HOSTS = new Set(['127.0.0.1', 'localhost']);

/**
 * The local test database (`npm run db:start`) only speaks plain http on this machine. It is
 * allowed for that one case: a development build, never a release bundle (NODE_ENV is always
 * 'production' there), and only for the loopback host. Production builds are also refused
 * any http URL by config/assertProductionEnv.js.
 */
function parseSupabaseUrl(value: string | undefined, appEnv: AppConfig['appEnv']): string | null {
  const trimmed = value?.trim();
  const isDevBuild = appEnv === 'development' && process.env.NODE_ENV !== 'production';
  if (trimmed && isDevBuild && /^http:\/\//i.test(trimmed)) {
    const local = plainLoopbackOrigin(trimmed);
    if (local) return local;
  }
  return parseHttpsUrl(value);
}

/**
 * The URL's origin when it is nothing but a loopback host and port. Credentials, a path or a
 * '@' / '\' anywhere are refused: HTTP clients disagree on where the host is in such URLs, so
 * this parser's "127.0.0.1" could be another one's remote server.
 */
function plainLoopbackOrigin(raw: string): string | null {
  if (/[@\\]/.test(raw)) return null;
  try {
    const url = new URL(raw);
    const isBare = url.pathname === '/' && !url.search && !url.hash;
    return LOCAL_DEV_HOSTS.has(url.hostname) && isBare ? url.origin : null;
  } catch {
    // Not a URL at all: the https check refuses it with the usual warning.
    return null;
  }
}

function loadConfig(): AppConfig {
  const port = parsePort(process.env.EXPO_PUBLIC_PORT, 8081);
  const appEnv = parseAppEnv(process.env.EXPO_PUBLIC_APP_ENV);
  const supabaseUrl = parseSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL, appEnv);
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;

  return Object.freeze({
    port,
    appEnv,
    supabaseUrl,
    supabaseAnonKey,
    isAiProxyConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    isCloudSyncConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    privacyPolicyUrl: parseHttpsUrl(
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL,
      'EXPO_PUBLIC_PRIVACY_POLICY_URL',
      'The privacy policy link stays hidden.'
    ),
    termsUrl: parseHttpsUrl(
      process.env.EXPO_PUBLIC_TERMS_URL,
      'EXPO_PUBLIC_TERMS_URL',
      'The terms link stays hidden.'
    ),
    revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() || null,
    revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() || null,
  });
}

export const env = loadConfig();
