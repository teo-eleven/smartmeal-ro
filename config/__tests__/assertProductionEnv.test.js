import { assertProductionEnv } from '../assertProductionEnv';

const GOOD = {
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_SUPABASE_URL: 'https://abcd.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-public-key',
  EXPO_PUBLIC_PRIVACY_POLICY_URL: 'https://smartmeal.ro/privacy',
  EXPO_PUBLIC_TERMS_URL: 'https://smartmeal.ro/terms',
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_publicKey123',
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: 'goog_publicKey123',
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

  /**
   * Apple requires the privacy policy to be reachable inside the app; both stores require
   * the link. A build without it would ship a sign-up screen agreeing to a policy nobody
   * can open.
   */
  test('fără adresa politicii de confidențialitate, build-ul de producție se oprește', () => {
    expect(() =>
      assertProductionEnv({ ...GOOD, EXPO_PUBLIC_PRIVACY_POLICY_URL: '' })
    ).toThrow(/EXPO_PUBLIC_PRIVACY_POLICY_URL/);
    expect(() =>
      assertProductionEnv({ ...GOOD, EXPO_PUBLIC_PRIVACY_POLICY_URL: 'http://x.ro/p' })
    ).toThrow(/EXPO_PUBLIC_PRIVACY_POLICY_URL/);
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

  /** Without the keys the app opens to a subscription screen that can never be paid. */
  test('fără cheile RevenueCat, build-ul de producție se oprește', () => {
    expect(() => assertProductionEnv({ ...GOOD, EXPO_PUBLIC_REVENUECAT_IOS_KEY: '' })).toThrow(
      /EXPO_PUBLIC_REVENUECAT_IOS_KEY/
    );
    expect(() => assertProductionEnv({ ...GOOD, EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: '' })).toThrow(
      /EXPO_PUBLIC_REVENUECAT_ANDROID_KEY/
    );
  });

  /**
   * The public SDK keys start appl_ and goog_. A secret key (sk_) in the bundle would let
   * anyone read and change every customer's purchases, so it stops the build outright.
   */
  test('o cheie secretă RevenueCat oprește build-ul', () => {
    expect(() =>
      assertProductionEnv({ ...GOOD, EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'sk_secretKey123' })
    ).toThrow(/secret/i);
  });

  test('cheile puse invers (iOS în locul Android) opresc build-ul', () => {
    expect(() =>
      assertProductionEnv({ ...GOOD, EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'goog_publicKey123' })
    ).toThrow(/EXPO_PUBLIC_REVENUECAT_IOS_KEY/);
  });

  /** Apple 3.1.2: a subscription screen must link to the terms of use. */
  test('fără adresa termenilor, build-ul de producție se oprește', () => {
    expect(() => assertProductionEnv({ ...GOOD, EXPO_PUBLIC_TERMS_URL: '' })).toThrow(
      /EXPO_PUBLIC_TERMS_URL/
    );
  });
});
