// Supabase Edge Function: send-reminder-emails
//
// Sends the periodic nudge to everyone who asked for one and is due.
//
// Called by a schedule, not by the app. Supabase edge functions are public URLs, so this one
// refuses anything that does not present the shared CRON_SECRET: without that check, anyone
// who found the URL could make the project email its own users on demand.
//
// Supabase's built-in email only handles auth templates, so the actual delivery goes through
// Resend. That needs a RESEND_API_KEY and a verified sending domain.
//
// Deploy:
//   supabase functions deploy send-reminder-emails --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=...
//   supabase secrets set CRON_SECRET=<a long random string>
//   supabase secrets set REMINDER_FROM="SmartMeal RO <mese@domeniul-tau.ro>"
//   supabase secrets set APP_URL=https://domeniul-tau.ro
//
// Schedule it from the SQL editor, once:
//   select cron.schedule(
//     'smartmeal-reminder-emails', '0 9 * * *',
//     $$ select net.http_post(
//          url    := 'https://<ref>.supabase.co/functions/v1/send-reminder-emails',
//          headers:= '{"x-cron-secret":"<the same secret>"}'::jsonb
//        ) $$);
//
// Daily at 09:00 is the cadence of the *job*; each user still only hears from it once every
// two or three days, because the query only returns those whose window has passed.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
const FROM = Deno.env.get('REMINDER_FROM') || 'SmartMeal RO <noreply@example.com>';
const APP_URL = Deno.env.get('APP_URL') || '';

/** One run should never fan out further than this, whatever the query returns. */
const MAX_PER_RUN = 500;

interface DueRow {
  user_id: string;
  email: string;
  frequency_days: number;
}

/**
 * Anything from the database goes through here before it reaches an email body. A plan is
 * user-supplied data, and the only thing standing between it and someone's inbox is this.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail(dishes: string[]): { subject: string; html: string; text: string } {
  const hasPlan = dishes.length > 0;

  const others = dishes.length - 1;
  const subject = !hasPlan
    ? 'Nu ai încă un meniu pentru săptămâna asta'
    : others === 0
      ? `Săptămâna ta: ${dishes[0]}`
      : others === 1
        ? `Săptămâna ta: ${dishes[0]} și încă un fel`
        : `Săptămâna ta: ${dishes[0]} și încă ${others} feluri`;

  const list = dishes.map((d) => `<li>${escapeHtml(d)}</li>`).join('');
  const link = APP_URL ? `<p><a href="${escapeHtml(APP_URL)}">Deschide SmartMeal</a></p>` : '';

  const html = hasPlan
    ? `<p>Bună,</p><p>Astea te așteaptă în plan:</p><ul>${list}</ul>${link}
       <p style="color:#666;font-size:12px">Poți opri mementourile pe email din aplicație,
       de la ecranul de cont.</p>`
    : `<p>Bună,</p><p>N-ai un meniu generat pentru săptămâna asta. Îți ia sub un minut.</p>
       ${link}<p style="color:#666;font-size:12px">Poți opri mementourile pe email din
       aplicație, de la ecranul de cont.</p>`;

  // The opt-out belongs in both bodies. A client that renders only the plain text would
  // otherwise show a recurring email with no way out stated in it.
  const optOut = '\n\nPoți opri mementourile pe email din aplicație, de la ecranul de cont.';
  const text =
    (hasPlan
      ? `Astea te așteaptă în plan:\n${dishes.map((d) => `- ${d}`).join('\n')}\n\n${APP_URL}`
      : `N-ai un meniu generat pentru săptămâna asta.\n\n${APP_URL}`) + optOut;

  return { subject, html, text };
}

async function sendOne(to: string, dishes: string[]): Promise<boolean> {
  const { subject, html, text } = buildEmail(dishes);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      // The address is not logged: an address plus a failure reason is personal data in a
      // log file that outlives the request.
      console.error('[send-reminder-emails] Delivery refused:', res.status);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[send-reminder-emails] Delivery failed:', e);
    return false;
  }
}

serve(async (req: Request) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // The whole gate. A public URL that emails your users on request is a public URL that
  // will be used to email your users.
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return json({ error: 'forbidden' }, 403);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    console.error('[send-reminder-emails] Missing configuration');
    return json({ error: 'not_configured' }, 500);
  }

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.rpc('reminders_due_for_email');
    if (error) {
      console.error('[send-reminder-emails] Could not read who is due:', error.message);
      return json({ error: 'query_failed' }, 500);
    }

    const due = (data ?? []).slice(0, MAX_PER_RUN) as DueRow[];
    let sent = 0;

    for (const row of due) {
      const { data: planRow } = await admin
        .from('user_meal_plans')
        .select('plan_data')
        .eq('user_id', row.user_id)
        .maybeSingle();

      const days = (
        planRow?.plan_data as { days?: { meals?: { recipe?: { title?: string } }[] }[] }
      )?.days;

      const dishes = Array.isArray(days)
        ? days
            .flatMap((d) => (Array.isArray(d.meals) ? d.meals : []))
            .map((m) => m?.recipe?.title)
            .filter((t): t is string => typeof t === 'string')
            .slice(0, 5)
        : [];

      if (await sendOne(row.email, dishes)) {
        // Marked only on success, so a delivery failure is retried on the next run rather
        // than silently skipping somebody for another three days.
        await admin.rpc('mark_reminder_email_sent', { p_user_id: row.user_id });
        sent += 1;
      }
    }

    return json({ due: due.length, sent });
  } catch (e) {
    console.error('[send-reminder-emails] Unexpected failure:', e);
    return json({ error: 'failed' }, 500);
  }
});
