// Supabase Edge Function: proxy-ai-swap
//
// Suggests a replacement meal with Claude (Haiku by default), on the server, so the API key
// never reaches the app. Replaces proxy-gemini-plan.
//
// Deploy:   supabase functions deploy proxy-ai-swap
// Secrets:  ANTHROPIC_API_KEY (required), AI_MODEL (optional, default claude-haiku-5-5),
//           REVENUECAT_SECRET_KEY, ALLOWED_ORIGINS; SUPABASE_URL and
//           SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.
//
// Every refusal carries fallbackToLocal, and every answer says isFallback, so the app never
// presents its own deterministic pick as an AI suggestion.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { checkEntitlement } from '../_shared/entitlement.ts';
import { corsHeaders, parseAllowedOrigins } from '../_shared/cors.ts';
import {
  buildSwapRequest,
  DEFAULT_AI_MODEL,
  parseSwapPayload,
  parseSwapResponse,
} from '../_shared/aiSwap.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const AI_MODEL = Deno.env.get('AI_MODEL') || DEFAULT_AI_MODEL;
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const REVENUECAT_SECRET_KEY = Deno.env.get('REVENUECAT_SECRET_KEY') || '';
const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

/**
 * The whole request must finish inside this, below the app's 8 s timeout: otherwise the app
 * has already given up and shown its own pick while this is still running and billing.
 */
const SERVER_BUDGET_MS = 7000;
/** Kept back for building and sending the answer once Claude has replied. */
const RESPONSE_MARGIN_MS = 300;
const MIN_UPSTREAM_MS = 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function json(body: unknown, status: number, cors: Record<string, string>, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, ...extra, 'Content-Type': 'application/json' },
  });
}

/** The caller's id from their own token; the public anon key proves nothing. */
async function authenticatedUserId(req: Request): Promise<string | null> {
  const header = req.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const user = await res.json();
    return typeof user?.id === 'string' ? user.id : null;
  } catch (e) {
    console.error('[proxy-ai-swap] Could not verify the caller:', e);
    return null;
  }
}

/** One shared counter in Postgres (migration 0002). Fails closed. */
async function isRateLimited(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_ai_call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ p_user_id: userId, p_limit: RATE_LIMIT_MAX_REQUESTS }),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) {
      console.error('[proxy-ai-swap] Rate limiter unavailable:', res.status);
      return true;
    }
    return (await res.json()) === true;
  } catch (e) {
    console.error('[proxy-ai-swap] Rate limiter failed:', e);
    return true;
  }
}

serve(async (req: Request) => {
  const startedAt = Date.now();
  const cors = corsHeaders(req, ALLOWED_ORIGINS);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, cors);

  const userId = await authenticatedUserId(req);
  if (!userId) return json({ error: 'unauthenticated', fallbackToLocal: true }, 401, cors);

  // Each call costs money and the app's paywall runs on a device its user controls, so the
  // subscription is checked here. Fails closed.
  const entitlement = await checkEntitlement(userId, REVENUECAT_SECRET_KEY);
  if (entitlement !== 'active') {
    const failed = entitlement === 'error';
    return json(
      {
        error: failed ? 'subscription_check_failed' : 'subscription_required',
        fallbackToLocal: true,
      },
      failed ? 503 : 403,
      cors
    );
  }

  if (!ANTHROPIC_API_KEY)
    return json({ error: 'not_configured', fallbackToLocal: true }, 503, cors);

  // Validated before the rate limit: a malformed request costs nothing and is not counted.
  const payload = parseSwapPayload(await req.json().catch(() => null));
  if (!payload) return json({ error: 'invalid_request', fallbackToLocal: true }, 400, cors);

  if (await isRateLimited(userId)) {
    return json({ error: 'too_many_requests', fallbackToLocal: true }, 429, cors, {
      'Retry-After': '60',
    });
  }

  const remaining = SERVER_BUDGET_MS - (Date.now() - startedAt) - RESPONSE_MARGIN_MS;
  if (remaining < MIN_UPSTREAM_MS) {
    return json({ error: 'timeout', fallbackToLocal: true }, 504, cors);
  }

  try {
    const response = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(buildSwapRequest(payload, AI_MODEL)),
      signal: AbortSignal.timeout(remaining),
    });

    if (!response.ok) {
      // Logged, never forwarded: upstream error bodies can carry request and quota details.
      console.error('[proxy-ai-swap] Upstream error', response.status, await response.text());
      return json({ error: 'upstream_error', fallbackToLocal: true }, 502, cors);
    }

    const answer = await response.json();
    const usage = answer?.usage;
    if (usage) {
      console.log('[proxy-ai-swap] usage', {
        input: usage.input_tokens,
        output: usage.output_tokens,
        cacheRead: usage.cache_read_input_tokens,
        cacheWrite: usage.cache_creation_input_tokens,
      });
    }

    const choice = parseSwapResponse(answer, payload.candidateRecipeIds);
    if (choice) return json({ ...choice, isFallback: false }, 200, cors);

    // Unusable answer: say so, and let the app pick on its own rather than call this "AI".
    return json({ error: 'unusable_answer', fallbackToLocal: true }, 502, cors);
  } catch (e) {
    // A generic message only: this endpoint is publicly reachable.
    console.error('[proxy-ai-swap] Unexpected failure:', e);
    return json({ error: 'internal_error', fallbackToLocal: true }, 500, cors);
  }
});
