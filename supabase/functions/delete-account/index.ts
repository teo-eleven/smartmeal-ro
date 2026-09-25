// Supabase Edge Function: delete-account
//
// Deletes the calling user's account and, through the `on delete cascade` on
// `user_meal_plans.user_id`, the plan stored against it.
//
// Both stores require this. Apple has required an in-app deletion path for every app that
// supports account creation since June 2022 (Guideline 5.1.1(v)); Google Play requires one
// in-app and one reachable from the web. This account holds declared allergies and dietary
// restrictions, which is special-category personal data under GDPR Article 9, so the right
// to erasure is not merely a store rule here.
//
// It runs server-side because deleting a user needs the service-role key, which must never
// reach the client. The caller is identified from their own JWT, never from the request
// body, so this function can only ever delete the account that called it.
//
// Deploy with:  supabase functions deploy delete-account
// Requires the SUPABASE_SERVICE_ROLE_KEY secret, which Supabase injects automatically.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

/**
 * Origins allowed to call this from a browser. Set ALLOWED_ORIGINS as a comma-separated
 * list; leaving it unset falls back to no origin at all rather than to '*', because this
 * endpoint destroys data. Native builds send no Origin header and are unaffected.
 */
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

serve(async (req: Request) => {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[delete-account] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 500, headers });
  }

  // The identity comes from the bearer token the caller presents, not from anything they
  // can write. Without this, a request body naming another user would delete that account.
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401, headers });
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error: lookupError } = await admin.auth.getUser(token);
    if (lookupError || !data?.user) {
      return new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401, headers });
    }

    // The cascade on user_meal_plans.user_id removes the stored plan with the account. The
    // row is deleted explicitly first so a failure there is reported rather than silently
    // leaving data behind if the cascade is ever dropped from the schema.
    const { error: rowError } = await admin
      .from('user_meal_plans')
      .delete()
      .eq('user_id', data.user.id);
    if (rowError) {
      console.error('[delete-account] Failed to delete the stored plan:', rowError.message);
      return new Response(JSON.stringify({ error: 'delete_failed' }), { status: 500, headers });
    }

    const { error: userError } = await admin.auth.admin.deleteUser(data.user.id);
    if (userError) {
      console.error('[delete-account] Failed to delete the account:', userError.message);
      return new Response(JSON.stringify({ error: 'delete_failed' }), { status: 500, headers });
    }

    return new Response(JSON.stringify({ deleted: true }), { status: 200, headers });
  } catch (e) {
    // Never forward the internal message: this endpoint is publicly callable.
    console.error('[delete-account] Unexpected failure:', e);
    return new Response(JSON.stringify({ error: 'delete_failed' }), { status: 500, headers });
  }
});
