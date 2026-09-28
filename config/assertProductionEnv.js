/**
 * Stops a production build that would ship without Supabase.
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
  'Vezi STORE.md §4.';

function assertProductionEnv(vars) {
  if ((vars.EXPO_PUBLIC_APP_ENV || '').trim() !== 'production') return;

  const url = (vars.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const anonKey = (vars.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  const problems = [];
  if (!url) problems.push('EXPO_PUBLIC_SUPABASE_URL lipsește');
  else if (!/^https:\/\//i.test(url))
    problems.push('EXPO_PUBLIC_SUPABASE_URL trebuie să fie https');
  if (!anonKey) problems.push('EXPO_PUBLIC_SUPABASE_ANON_KEY lipsește');

  if (problems.length > 0) {
    throw new Error(
      `Build-ul de producție s-ar face fără Supabase: ${problems.join('; ')}.\n` +
        'Conturile n-ar funcționa, iar recenzentul ar da exact peste asta.\n' +
        FIX
    );
  }
}

module.exports = { assertProductionEnv };
