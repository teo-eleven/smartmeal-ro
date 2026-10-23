import { corsHeaders, parseAllowedOrigins } from '../../../supabase/functions/_shared/cors';

/**
 * One CORS rule for every function: closed unless the origin is listed. proxy-gemini-plan
 * used to answer '*' whenever ALLOWED_ORIGINS was left unset.
 */
const request = (origin?: string) =>
  ({ headers: { get: (name: string) => (name === 'origin' ? (origin ?? null) : null) } }) as never;

test('fără listă configurată, niciun site nu primește acces', () => {
  expect(corsHeaders(request('https://evil.example'), [])['Access-Control-Allow-Origin']).toBe('');
});

test('un site din listă primește acces, pe numele lui, nu „*”', () => {
  const allowed = parseAllowedOrigins('https://smartmeal.ro, https://staging.smartmeal.ro');

  expect(corsHeaders(request('https://smartmeal.ro'), allowed)['Access-Control-Allow-Origin']).toBe(
    'https://smartmeal.ro'
  );
});

test('un site care nu e în listă nu primește acces', () => {
  const allowed = parseAllowedOrigins('https://smartmeal.ro');

  expect(corsHeaders(request('https://evil.example'), allowed)['Access-Control-Allow-Origin']).toBe(
    ''
  );
});

test('lista ignoră spațiile și intrările goale', () => {
  expect(parseAllowedOrigins(' https://a.ro ,, https://b.ro ')).toEqual([
    'https://a.ro',
    'https://b.ro',
  ]);
});

test('răspunsul variază după Origin, ca un cache să nu-l dea altui site', () => {
  expect(corsHeaders(request('https://smartmeal.ro'), [])['Vary']).toBe('Origin');
});
