// Supabase Edge Function: unsubscribe-reminders
//
// Turns off reminder emails for one person, from a signed link in one of those emails.
//
// POST only. Mail scanners and link previews open every GET they find, so a GET that
// unsubscribed would switch people off without them ever clicking. Two callers POST here:
//   - the mail client's own "Unsubscribe" button, via the List-Unsubscribe header
//     (RFC 8058 one-click), with the body "List-Unsubscribe=One-Click";
//   - public/unsubscribe.html on the app's domain, after the person presses the button.
// The confirmation page lives there rather than here because Supabase rewrites text/html
// responses on *.supabase.co to text/plain unless the project has a custom domain.
//
// Deploy:
//   supabase functions deploy unsubscribe-reminders --no-verify-jwt
//   supabase secrets set UNSUBSCRIBE_SECRET=<a long random string, not the cron secret>

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyUnsubscribe } from '../_shared/unsubscribeToken.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET') || '';
/** The app's own site, where unsubscribe.html is served. The only origin allowed to call. */
const APP_URL = Deno.env.get('APP_URL') || '';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  // The mail client's one-click POST has no Origin, and needs no CORS. A browser POST from
  // any site but ours gets no permission to read the answer.
  if (!origin || !APP_URL || origin !== new URL(APP_URL).origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
}

serve(async (req: Request) => {
  const cors = corsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !UNSUBSCRIBE_SECRET) {
    console.error('[unsubscribe-reminders] Missing configuration');
    return json({ error: 'not_configured' }, 500);
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('u') ?? '';
  const token = url.searchParams.get('t') ?? '';

  // One answer for every kind of bad link, so the endpoint cannot be used to learn whether
  // an id exists.
  if (!(await verifyUnsubscribe(userId, token, UNSUBSCRIBE_SECRET))) {
    return json({ error: 'invalid_link' }, 400);
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // An update, not an upsert: someone with no reminder row has nothing to turn off, and
    // creating one here would invent a preference they never set. updated_at is set by the
    // trigger from migration 0003.
    const { error } = await admin
      .from('user_reminders')
      .update({ email_enabled: false })
      .eq('user_id', userId);

    if (error) {
      console.error('[unsubscribe-reminders] Update failed:', error.message);
      return json({ error: 'failed' }, 500);
    }

    // Unsubscribing twice is still a success; the person wanted it off and it is off.
    return json({ unsubscribed: true });
  } catch (e) {
    console.error('[unsubscribe-reminders] Unexpected failure:', e);
    return json({ error: 'failed' }, 500);
  }
});
