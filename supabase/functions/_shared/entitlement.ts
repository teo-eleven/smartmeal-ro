// Whether a user's monthly subscription is active, asked of RevenueCat from the server.
//
// The app checks the subscription too, but the app runs on a device its user controls: a
// modified copy can skip its own paywall. Anything that costs money per call, the Gemini
// suggestions above all, has to ask here instead.
//
// Fails closed: a RevenueCat that cannot be reached answers "error", never "active".
//
// Uses the SECRET key (REVENUECAT_SECRET_KEY), which only ever lives in the server's
// secrets. The app ships the public SDK keys; the build refuses a secret one.

export type EntitlementCheck = 'active' | 'inactive' | 'error';

/** The entitlement the monthly subscription grants; same id as in the app. */
const ENTITLEMENT_ID = 'premium';
const TIMEOUT_MS = 5000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFuture(value: unknown, now: number): boolean {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time > now;
}

export async function checkEntitlement(
  userId: string,
  secretKey: string,
  fetchImpl: typeof fetch = fetch,
  now: number = Date.now()
): Promise<EntitlementCheck> {
  if (!secretKey || !userId) return 'error';

  try {
    const res = await fetchImpl(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      console.error('[entitlement] RevenueCat answered', res.status);
      return 'error';
    }

    const body: unknown = await res.json();
    const entitlements =
      isObject(body) && isObject(body.subscriber) ? body.subscriber.entitlements : null;
    const premium = isObject(entitlements) ? entitlements[ENTITLEMENT_ID] : null;
    if (!isObject(premium)) return 'inactive';

    // A null expiry is a lifetime purchase; a grace period means a failed renewal the store
    // is still retrying, during which Apple and Google expect access to continue.
    if (premium.expires_date === null) return 'active';
    if (isFuture(premium.expires_date, now)) return 'active';
    if (isFuture(premium.grace_period_expires_date, now)) return 'active';
    return 'inactive';
  } catch (e) {
    console.error('[entitlement] Could not reach RevenueCat:', e);
    return 'error';
  }
}
