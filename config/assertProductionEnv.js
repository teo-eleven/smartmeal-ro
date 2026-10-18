/**
 * Stops a production build that would ship without Supabase or without a privacy policy link.
 *
 * .env is gitignored, so EAS never uploads it; a production build only gets these values from
 * the project's EAS environment variables. Without them the app starts, shows the sign-in
 * screen, and signing in is impossible — the first thing App Review would try. The local
 * account simulation cannot stand in: it refuses to run in production, on purpose.
 *
 * Plain CommonJS, because app.config.js runs in Node before any bundler or TypeScript.
 */
const FIX =
  'Setează-le pentru mediul production, apoi refă build-ul:\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_URL --value https://<ref>.supabase.co\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <cheia anon>\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_PRIVACY_POLICY_URL --value https://<domeniul-tau>/privacy\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_TERMS_URL --value https://<domeniul-tau>/terms\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_...\n' +
  '  eas env:set --environment production --visibility plaintext --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_...\n' +
  'Vezi STORE.md §4.';

/**
 * The public SDK keys start appl_ (iOS) and goog_ (Android). A secret key (sk_) shipped in
 * the bundle would let anyone read and change every customer's purchases.
 */
function checkRevenueCatKey(value, name, prefix) {
  const key = (value || '').trim();
  if (!key) return [`${name} lipsește`];
  if (key.startsWith('sk_'))
    return [`${name} e cheia SECRETĂ RevenueCat; aici merge cheia publică ${prefix}…`];
  if (!key.startsWith(prefix)) return [`${name} trebuie să înceapă cu ${prefix}`];
  return [];
}

function assertProductionEnv(vars) {
  if ((vars.EXPO_PUBLIC_APP_ENV || '').trim() !== 'production') return;

  const url = (vars.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (vars.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  const problems = [];
  if (!url) problems.push('EXPO_PUBLIC_SUPABASE_URL lipsește');
  else if (!/^https:\/\//i.test(url))
    problems.push('EXPO_PUBLIC_SUPABASE_URL trebuie să fie https');
  if (!anonKey) problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY lipsește');
  // Apple requires the policy to be reachable in the app, and the sign-up consent points at it.
  const privacyUrl = (vars.EXPO_PUBLIC_PRIVACY_POLICY_URL || '').trim();
  if (!/^https:\/\//i.test(privacyUrl)) {
    problems.push('EXPO_PUBLIC_PRIVACY_POLICY_URL lipsește sau nu e https');
  }
  // Apple 3.1.2: the subscription screen links to the terms of use.
  const termsUrl = (vars.EXPO_PUBLIC_TERMS_URL || '').trim();
  if (!/^https:\/\//i.test(termsUrl)) {
    problems.push('EXPO_PUBLIC_TERMS_URL lipsește sau nu e https');
  }
  // Without these the app opens onto a subscription screen that can never be paid.
  problems.push(
    ...checkRevenueCatKey(
      vars.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
      'appl_'
    )
  );
  problems.push(
    ...checkRevenueCatKey(
      vars.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
      'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
      'goog_'
    )
  );

  if (problems.length > 0) {
    throw new Error(
      `Build-ul de producție nu e complet: ${problems.join('; ')}.\n` +
        'Fără ele conturile nu merg sau politica de confidențialitate lipsește din aplicație,\n' +
        'iar recenzentul ar da exact peste asta.\n' +
        FIX
    );
  }
}

module.exports = { assertProductionEnv };
