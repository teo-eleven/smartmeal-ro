// Signed unsubscribe links, shared by send-reminder-emails (which signs) and
// unsubscribe-reminders (which verifies).
//
// The link carries the user id in the clear. Without a signature, anyone could switch off
// someone else's reminders by guessing or collecting ids; with one, only the link that was
// actually emailed to that person works. The token never expires, on purpose: the only thing
// it can do is stop emails, and an unsubscribe link that dies is a spam complaint.

const encoder = new TextEncoder();

/** Only a UUID is ever a user id here; anything else is refused before it reaches a query. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUserId(value: string | null): value is string {
  return typeof value === 'string' && UUID.test(value);
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  // The purpose is part of the signed message, so a token minted here can never be replayed
  // as a signature for anything else signed with the same secret.
  return toBase64Url(
    await crypto.subtle.sign('HMAC', key, encoder.encode(`unsubscribe:${message}`))
  );
}

/**
 * Compares without stopping at the first difference, so response time says nothing about how
 * much of a guessed token was right.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export function signUnsubscribe(userId: string, secret: string): Promise<string> {
  // WebCrypto would refuse an empty key anyway, but with an error that names nothing useful.
  // Signing with no secret must never quietly produce a link.
  if (!secret) return Promise.reject(new Error('UNSUBSCRIBE_SECRET is not set'));
  return hmac(secret, userId);
}

export async function verifyUnsubscribe(
  userId: string,
  token: string,
  secret: string
): Promise<boolean> {
  if (!secret || !isUserId(userId) || !token) return false;
  return timingSafeEqual(await hmac(secret, userId), token);
}
