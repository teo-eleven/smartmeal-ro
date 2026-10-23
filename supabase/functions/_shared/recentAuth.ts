/**
 * Whether a (server-verified) access token proves an authentication from the last few
 * minutes. Read from the amr claim, which Supabase fills with each method and when it was
 * used; iat is no help, it moves every time the token refreshes on its own.
 *
 * No Deno or Node APIs beyond atob, so it runs in both and is tested from the app's Jest.
 * Call it only after the token has been verified (auth.getUser): it decodes, it does not
 * check signatures.
 */
export const RECENT_AUTH_SECONDS = 5 * 60;

function decodePayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload: unknown = JSON.parse(atob(padded));
    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isRecentlyAuthenticated(token: string, nowSeconds: number): boolean {
  const amr = decodePayload(token)?.amr;
  if (!Array.isArray(amr)) return false;
  const times = amr
    .map((entry) => (typeof entry === 'object' && entry !== null ? entry.timestamp : null))
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t <= nowSeconds);
  if (times.length === 0) return false;
  return nowSeconds - Math.max(...times) <= RECENT_AUTH_SECONDS;
}
