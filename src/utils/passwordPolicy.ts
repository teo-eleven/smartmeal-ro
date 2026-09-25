/**
 * What counts as an acceptable password.
 *
 * Supabase enforces six characters by default, which is below what either store's reviewers
 * expect of an app holding health-adjacent data. Checking here as well means the user is
 * told before the round trip, in their own language, rather than by a server error.
 */
export const MIN_PASSWORD_LENGTH = 10;

export function describeWeakPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Parola trebuie să conțină cel puțin o literă și o cifră.';
  }
  // Rejecting the handful of passwords that appear in every leaked list costs nothing and
  // stops the worst of them; anything beyond that belongs to the server, not the keyboard.
  const common = ['parola', 'password', '1234567890', 'qwertyuiop', 'smartmeal'];
  if (common.some((weak) => password.toLowerCase().includes(weak))) {
    return 'Alege o parolă mai greu de ghicit.';
  }
  return null;
}
