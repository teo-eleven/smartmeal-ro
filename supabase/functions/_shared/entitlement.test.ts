// Run with: deno test supabase/functions/_shared/
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { checkEntitlement } from './entitlement.ts';

const NOW = Date.parse('2026-09-28T12:00:00Z');
const USER = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';

function answer(status: number, body: unknown): typeof fetch {
  return (() => Promise.resolve(new Response(JSON.stringify(body), { status }))) as typeof fetch;
}
function withPremium(entitlement: Record<string, unknown>) {
  return { subscriber: { entitlements: { premium: entitlement } } };
}

Deno.test('un abonament care expiră în viitor e activ', async () => {
  const f = answer(200, withPremium({ expires_date: '2026-10-28T12:00:00Z' }));
  assertEquals(await checkEntitlement(USER, 'sk_x', f, NOW), 'active');
});

Deno.test('un abonament expirat nu e activ', async () => {
  const f = answer(200, withPremium({ expires_date: '2026-09-01T12:00:00Z' }));
  assertEquals(await checkEntitlement(USER, 'sk_x', f, NOW), 'inactive');
});

Deno.test('în perioada de grație a plății, rămâne activ', async () => {
  const f = answer(
    200,
    withPremium({
      expires_date: '2026-09-27T12:00:00Z',
      grace_period_expires_date: '2026-10-05T12:00:00Z',
    })
  );
  assertEquals(await checkEntitlement(USER, 'sk_x', f, NOW), 'active');
});

Deno.test('fără dreptul „premium”, nu e activ', async () => {
  const f = answer(200, { subscriber: { entitlements: {} } });
  assertEquals(await checkEntitlement(USER, 'sk_x', f, NOW), 'inactive');
});

Deno.test('o dată de expirare stricată nu deschide nimic', async () => {
  const f = answer(200, withPremium({ expires_date: 'mâine' }));
  assertEquals(await checkEntitlement(USER, 'sk_x', f, NOW), 'inactive');
});

/** Fail closed: an unreachable RevenueCat never becomes free AI. */
Deno.test('dacă RevenueCat nu răspunde corect, rezultatul e „eroare”, nu „activ”', async () => {
  assertEquals(await checkEntitlement(USER, 'sk_x', answer(500, {}), NOW), 'error');
  const broken = (() => Promise.reject(new Error('down'))) as typeof fetch;
  assertEquals(await checkEntitlement(USER, 'sk_x', broken, NOW), 'error');
});

Deno.test('fără cheie secretă nu întreabă nimic și dă eroare', async () => {
  let called = false;
  const f = (() => {
    called = true;
    return Promise.resolve(new Response('{}'));
  }) as typeof fetch;
  assertEquals(await checkEntitlement(USER, '', f, NOW), 'error');
  assertEquals(called, false);
});

Deno.test('id-ul utilizatorului e codat în adresă', async () => {
  let url = '';
  const f = ((input: string) => {
    url = input;
    return Promise.resolve(new Response(JSON.stringify({ subscriber: { entitlements: {} } })));
  }) as unknown as typeof fetch;
  await checkEntitlement('a/b?c', 'sk_x', f, NOW);
  assertEquals(url, 'https://api.revenuecat.com/v1/subscribers/a%2Fb%3Fc');
});
