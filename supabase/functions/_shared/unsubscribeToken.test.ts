// Run with: deno test supabase/functions/_shared/
import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
} from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import {
  isUserId,
  signUnsubscribe,
  timingSafeEqual,
  verifyUnsubscribe,
} from './unsubscribeToken.ts';

const SECRET = 'secret-de-test-lung-si-aleator';
const ALICE = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const BOB = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';

Deno.test('linkul trimis unui om funcționează pentru el', async () => {
  const token = await signUnsubscribe(ALICE, SECRET);

  assert(await verifyUnsubscribe(ALICE, token, SECRET));
});

Deno.test('linkul unui om nu dezabonează pe altcineva', async () => {
  const token = await signUnsubscribe(ALICE, SECRET);

  assertFalse(await verifyUnsubscribe(BOB, token, SECRET));
});

Deno.test('un token modificat nu trece', async () => {
  const token = await signUnsubscribe(ALICE, SECRET);
  const tampered = (token[0] === 'A' ? 'B' : 'A') + token.slice(1);

  assertFalse(await verifyUnsubscribe(ALICE, tampered, SECRET));
});

Deno.test('fără secretul corect nu trece', async () => {
  const token = await signUnsubscribe(ALICE, 'alt-secret');

  assertFalse(await verifyUnsubscribe(ALICE, token, SECRET));
});

Deno.test('fără secret nu se semnează nimic', async () => {
  await assertRejects(() => signUnsubscribe(ALICE, ''), Error, 'UNSUBSCRIBE_SECRET');
});

Deno.test('fără secret nu se acceptă nimic, nici un token altfel valid', async () => {
  const token = await signUnsubscribe(ALICE, SECRET);

  assertFalse(await verifyUnsubscribe(ALICE, token, ''));
});

Deno.test('doar un UUID e acceptat ca id de utilizator', async () => {
  assert(isUserId(ALICE));
  assertFalse(isUserId("1' or '1'='1"));
  assertFalse(isUserId(''));
  assertFalse(isUserId(null));
  assertFalse(await verifyUnsubscribe('nu-e-uuid', 'orice', SECRET));
});

Deno.test('tokenul e sigur într-un URL', async () => {
  const token = await signUnsubscribe(ALICE, SECRET);

  assert(/^[A-Za-z0-9_-]+$/.test(token));
});

Deno.test('comparația în timp constant', () => {
  assert(timingSafeEqual('abc', 'abc'));
  assertFalse(timingSafeEqual('abc', 'abd'));
  assertFalse(timingSafeEqual('abc', 'abcd'));
  assertFalse(timingSafeEqual('', 'a'));
  assertEquals(timingSafeEqual('', ''), true);
});
