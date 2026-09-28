import { assertProductionEnv } from '../assertProductionEnv';

const GOOD = {
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_SUPABASE_URL: 'https://abcd.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-public-key',
};

/**
 * .env is gitignored, so EAS never uploads it. A production build made without the project's
 * EAS environment variables ships with no Supabase at all: the sign-in screen appears, and
 * signing in is impossible — which is what App Review would be the first to try. The build
 * has to stop instead.
 */
describe('garda build-ului de producție', () => {
  test('un build de producție complet trece', () => {
    expect(() => assertProductionEnv(GOOD)).not.toThrow();
  });

  test('fără adresa Supabase, build-ul de producție se oprește', () => {
    expect(() => assertProductionEnv({ ...GOOD, EXPO_PUBLIC_SUPABASE_URL: '' })).toThrow(
      /EXPO_PUBLIC_SUPABASE_URL/
    );
  });

  test('fără cheia publică, build-ul de producție se oprește', () => {
    expect(() => assertProductionEnv({ ...GOOD, EXPO_PUBLIC_SUPABASE_ANON_KEY: ' ' })).toThrow(
      /EXPO_PUBLIC_SUPABASE_ANON_KEY/
    );
  });

  test('o adresă http, nu https, oprește build-ul', () => {
    expect(() =>
      assertProductionEnv({ ...GOOD, EXPO_PUBLIC_SUPABASE_URL: 'http://abcd.supabase.co' })
    ).toThrow(/https/);
  });

  test('mesajul spune și cum se repară', () => {
    expect(() => assertProductionEnv({ EXPO_PUBLIC_APP_ENV: 'production' })).toThrow(/eas env:set/);
  });

  /** On a laptop, with no project yet, the local account simulation is what runs. */
  test('în dezvoltare nu cere nimic', () => {
    expect(() => assertProductionEnv({ EXPO_PUBLIC_APP_ENV: 'development' })).not.toThrow();
    expect(() => assertProductionEnv({})).not.toThrow();
  });
});
