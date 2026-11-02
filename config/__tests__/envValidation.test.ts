/**
 * Config is validated at startup on purpose: a malformed value should fail loudly at boot
 * rather than produce a confusing failure later. These tests pin that behaviour.
 */
describe('environment validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function loadConfig() {
    /* eslint-disable-next-line @typescript-eslint/no-require-imports */
    return require('../env').env;
  }

  test('falls back to port 8081 when none is given', () => {
    delete process.env.EXPO_PUBLIC_PORT;
    expect(loadConfig().port).toBe(8081);
  });

  test('accepts a valid custom port', () => {
    process.env.EXPO_PUBLIC_PORT = '19006';
    expect(loadConfig().port).toBe(19006);
  });

  test('refuses a port that is not a number', () => {
    process.env.EXPO_PUBLIC_PORT = 'not-a-port';
    expect(() => loadConfig()).toThrow(/EXPO_PUBLIC_PORT/);
  });

  test('refuses a port outside the valid range', () => {
    process.env.EXPO_PUBLIC_PORT = '70000';
    expect(() => loadConfig()).toThrow(/EXPO_PUBLIC_PORT/);
  });

  test('refuses port zero', () => {
    process.env.EXPO_PUBLIC_PORT = '0';
    expect(() => loadConfig()).toThrow(/EXPO_PUBLIC_PORT/);
  });

  test('defaults the environment to development', () => {
    delete process.env.EXPO_PUBLIC_APP_ENV;
    expect(loadConfig().appEnv).toBe('development');
  });

  test('accepts each supported environment', () => {
    (['development', 'staging', 'production'] as const).forEach((value) => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_APP_ENV = value;
      expect(loadConfig().appEnv).toBe(value);
    });
  });

  test('refuses an unknown environment name', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'qa';
    expect(() => loadConfig()).toThrow(/EXPO_PUBLIC_APP_ENV/);
  });

  test('treats cloud sync as configured only when both values are present', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://x.supabase.co';
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(loadConfig().isCloudSyncConfigured).toBe(false);

    jest.resetModules();
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon';
    expect(loadConfig().isCloudSyncConfigured).toBe(true);
  });

  describe('the local test database (npm run db:start) over plain http', () => {
    const LOCAL_URL = 'http://127.0.0.1:54321';

    test('is accepted in development', () => {
      delete process.env.EXPO_PUBLIC_APP_ENV;
      process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL_URL;
      expect(loadConfig().supabaseUrl).toBe(LOCAL_URL);
    });

    test('is accepted as localhost too', () => {
      process.env.EXPO_PUBLIC_APP_ENV = 'development';
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321/';
      expect(loadConfig().supabaseUrl).toBe('http://localhost:54321');
    });

    test('is refused in staging and production', () => {
      (['staging', 'production'] as const).forEach((value) => {
        jest.resetModules();
        process.env.EXPO_PUBLIC_APP_ENV = value;
        process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL_URL;
        expect(loadConfig().supabaseUrl).toBeNull();
      });
    });

    test('is refused in a release bundle, whatever the app env says', () => {
      process.env.EXPO_PUBLIC_APP_ENV = 'development';
      process.env.EXPO_PUBLIC_SUPABASE_URL = LOCAL_URL;
      const nodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        expect(loadConfig().supabaseUrl).toBeNull();
      } finally {
        process.env.NODE_ENV = nodeEnv;
      }
    });

    test('plain http to any other host is still refused in development', () => {
      process.env.EXPO_PUBLIC_APP_ENV = 'development';
      [
        'http://x.supabase.co',
        'http://127.0.0.1.evil.ro',
        'http://192.168.1.5:54321',
        // Credentials in the URL: another HTTP client could read the host differently.
        'http://evil.ro@127.0.0.1:54321',
        'http://127.0.0.1\\@evil.ro',
      ].forEach((url) => {
        jest.resetModules();
        process.env.EXPO_PUBLIC_SUPABASE_URL = url;
        expect(loadConfig().supabaseUrl).toBeNull();
      });
    });
  });

  /** Apple requires the privacy policy to be reachable from inside the app (5.1.1(i)). */
  test('adresa politicii de confidențialitate e citită doar dacă e https', () => {
    delete process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
    expect(loadConfig().privacyPolicyUrl).toBeNull();

    jest.resetModules();
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = 'http://site.ro/privacy';
    expect(loadConfig().privacyPolicyUrl).toBeNull();

    jest.resetModules();
    process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL = 'https://site.ro/privacy';
    expect(loadConfig().privacyPolicyUrl).toBe('https://site.ro/privacy');
  });

  test('cheile RevenueCat și adresa termenilor sunt citite', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'appl_x';
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = 'goog_x';
    process.env.EXPO_PUBLIC_TERMS_URL = 'https://site.ro/terms';

    const config = loadConfig();

    expect(config.revenueCatIosKey).toBe('appl_x');
    expect(config.revenueCatAndroidKey).toBe('goog_x');
    expect(config.termsUrl).toBe('https://site.ro/terms');
  });

  test('fără chei, abonamentele nu sunt configurate', () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
    delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

    expect(loadConfig().revenueCatIosKey).toBeNull();
  });

  test('the config object cannot be mutated at runtime', () => {
    const config = loadConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });
});
