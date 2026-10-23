/**
 * One CORS rule for every function: closed unless the caller's origin is listed in
 * ALLOWED_ORIGINS (comma-separated). Native apps send no Origin and are unaffected; a browser
 * on any other site gets no permission to read the answer. Never '*'.
 *
 * Framework-free, so the app's Jest can test it.
 */
export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function corsHeaders(
  req: { headers: { get(name: string): string | null } },
  allowedOrigins: string[]
): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}
