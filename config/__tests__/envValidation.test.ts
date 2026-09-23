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

  test('the config object cannot be mutated at runtime', () => {
    const config = loadConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });
});
