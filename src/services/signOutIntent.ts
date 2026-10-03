/**
 * Whether a sign-out under way was asked for — "Deconectare", deleting the account, leaving
 * the monthly lock — as opposed to the session ending on its own.
 *
 * supabase-js announces both the same way, with a SIGNED_OUT event fired before signOut()
 * returns, while the app still shows the account. The watcher in store/deviceSession.ts asks
 * here, so a sign-out somebody chose is not reported to them as "Sesiunea a expirat".
 */
let intentional = 0;

export async function signingOutOnPurpose<T>(work: () => Promise<T>): Promise<T> {
  intentional += 1;
  try {
    return await work();
  } finally {
    intentional -= 1;
  }
}

export function isSigningOutOnPurpose(): boolean {
  return intentional > 0;
}
