/**
 * Romanian text for Supabase auth errors.
 *
 * Supabase answers in English ("Invalid login credentials"), and the service used to pass
 * that straight to a Romanian screen. The mapping goes by error code, which Supabase keeps
 * stable, rather than by the English text. An unknown code still gets a Romanian sentence:
 * never the raw text, which may also say more about the server than a user needs.
 */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Adresa sau parola nu sunt corecte.',
  email_not_confirmed:
    'Adresa nu e confirmată încă. Deschide emailul primit la crearea contului și apasă linkul de confirmare.',
  user_already_exists: 'Există deja un cont cu adresa asta. Conectează-te sau resetează parola.',
  email_exists: 'Există deja un cont cu adresa asta. Conectează-te sau resetează parola.',
  identity_already_exists:
    'Există deja un cont cu adresa asta. Conectează-te sau resetează parola.',
  weak_password: 'Parola e prea slabă. Folosește cel puțin 10 caractere, cu litere și cifre.',
  same_password: 'Parola nouă trebuie să fie diferită de cea veche.',
  email_address_invalid: 'Adresa de email nu pare validă.',
  signup_disabled: 'Crearea de conturi noi nu e disponibilă acum.',
  user_not_found: 'Adresa sau parola nu sunt corecte.',
  otp_expired: 'Codul a expirat. Cere altul.',
  over_request_rate_limit: 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.',
  over_email_send_rate_limit:
    'Prea multe emailuri trimise. Așteaptă câteva minute și încearcă din nou.',
};

const FALLBACK = 'A apărut o problemă la autentificare. Încearcă din nou.';

export function describeAuthError(error: { code?: string; message?: string } | null): string {
  return (error?.code && MESSAGES[error.code]) || FALLBACK;
}

/**
 * What to show when a call throws: the Romanian description of what failed, with the detail
 * sent to the log. The pattern it replaces, `e instanceof Error ? e.message : '<Romanian>'`,
 * almost always took the English branch, since nearly everything thrown is an Error:
 * "Failed to fetch" and "Network request failed" reached the screen as they were.
 */
export function describeFailure(e: unknown, whatFailed: string): string {
  console.warn(`[SmartMeal] ${whatFailed}`, e);
  return `${whatFailed} Verifică conexiunea la internet și încearcă din nou.`;
}

/**
 * Logs a failure without the rest of the error object. Supabase and PostgREST errors can
 * carry request details, hints and row fragments — an address, a name — and a log is not
 * the place for them. The code and the message are enough to find the cause.
 */
export function warnSafely(whatFailed: string, e: unknown): void {
  const fields = typeof e === 'object' && e !== null ? (e as Record<string, unknown>) : {};
  console.warn(`[SmartMeal] ${whatFailed}`, {
    code: typeof fields.code === 'string' ? fields.code : undefined,
    message: typeof fields.message === 'string' ? fields.message : String(e),
  });
}
