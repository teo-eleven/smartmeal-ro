// Supabase Edge Function: proxy-gemini-plan
// Securely proxies meal planning and smart swap requests to Google Gemini Flash
// Deno TypeScript environment

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface RequestPayload {
  action: 'suggest_swap' | 'generate_plan';
  peopleCount: number;
  budgetRon: number;
  supermarketId: string;
  dietType: string;
  appliances: string[];
  moodTags: string[];
  candidateRecipeIds: string[];
  currentMealId?: string;
  userPrompt?: string;
}

/**
 * Origins allowed to call this function from a browser. Set ALLOWED_ORIGINS as a
 * comma-separated list; leaving it unset falls back to '*', which is only appropriate while
 * developing. Native builds send no Origin header and are unaffected either way.
 */
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowed =
    ALLOWED_ORIGINS.length === 0 ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    Vary: 'Origin',
  };
}

/**
 * The anon key is public by design, so it is not a meaningful gate on its own. This bounds
 * what a single caller can burn of the project's Gemini quota. In-memory, so it resets when
 * the isolate recycles and does not coordinate across instances — enough to stop casual
 * scripted abuse, not a substitute for a shared store if this ever gets real traffic.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const callers = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(req: Request): boolean {
  const caller =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown';
  const now = Date.now();
  const entry = callers.get(caller);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    callers.set(caller, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/** Caps on anything that ends up inside the prompt, so cost per call cannot be inflated. */
const MAX_CANDIDATE_IDS = 60;
const MAX_USER_PROMPT_CHARS = 300;
const MAX_FIELD_CHARS = 80;
const MAX_LIST_ITEMS = 20;

function asSafeString(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function asSafeList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .slice(0, maxItems)
    .map((item) => item.slice(0, MAX_FIELD_CHARS));
}

/**
 * Validates the request rather than trusting its shape. Returns null when the payload cannot
 * be used, so the caller answers 400 instead of throwing deep inside prompt construction.
 */
function parsePayload(raw: unknown): RequestPayload | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const body = raw as Record<string, unknown>;

  const candidateRecipeIds = asSafeList(body.candidateRecipeIds, MAX_CANDIDATE_IDS);
  if (candidateRecipeIds.length === 0) return null;

  const action = body.action === 'generate_plan' ? 'generate_plan' : 'suggest_swap';
  const peopleCount = Number(body.peopleCount);
  const budgetRon = Number(body.budgetRon);

  return {
    action,
    peopleCount: Number.isFinite(peopleCount) ? Math.min(Math.max(peopleCount, 1), 20) : 2,
    budgetRon: Number.isFinite(budgetRon) ? Math.min(Math.max(budgetRon, 1), 100000) : 200,
    supermarketId: asSafeString(body.supermarketId, MAX_FIELD_CHARS),
    dietType: asSafeString(body.dietType, MAX_FIELD_CHARS),
    appliances: asSafeList(body.appliances, MAX_LIST_ITEMS),
    moodTags: asSafeList(body.moodTags, MAX_LIST_ITEMS),
    candidateRecipeIds,
    currentMealId: asSafeString(body.currentMealId, MAX_FIELD_CHARS) || undefined,
    userPrompt: asSafeString(body.userPrompt, MAX_USER_PROMPT_CHARS) || undefined,
  };
}

serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (isRateLimited(req)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests', fallbackToLocal: true }),
      { status: 429, headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Supabase secrets.',
          fallbackToLocal: true,
        }),
        {
          status: 503,
          headers: { ...cors, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = parsePayload(await req.json().catch(() => null));
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid request payload', fallbackToLocal: true }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const systemInstruction = `Ești un asistent culinar expert pentru aplicația SmartMeal RO.
Rolul tău este să recomanzi cea mai potrivită rețetă din lista de rețete candidate furnizată,
respectând cu strictețe bugetul în LEI, tipul de dietă (${payload.dietType}), electrocasnicele disponibile (${payload.appliances.join(', ')}),
și preferințele utilizatorului. Răspunde exclusiv în format JSON valid.`;

    const prompt = `
Acțiune solicitată: ${payload.action}
Persoane: ${payload.peopleCount}
Buget săptămânal: ${payload.budgetRon} RON
Supermarket: ${payload.supermarketId}
Electrocasnice: ${payload.appliances.join(', ')}
Stil/Moods: ${payload.moodTags.join(', ')}
${payload.currentMealId ? `Rețetă curentă de înlocuit: ${payload.currentMealId}` : ''}
${payload.userPrompt ? `Preferință utilizator: "${payload.userPrompt}"` : ''}

Rețete candidate eligibile (ID-uri):
${JSON.stringify(payload.candidateRecipeIds)}

Alege cel mai bun ID de rețetă din lista de candidate și oferă o scurtă justificare în limba română (sub 15 cuvinte).
Structura JSON:
{
  "selectedRecipeId": "id_din_lista_de_candidate",
  "reasonRo": "justificare scurta"
}
`;

    const geminiBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errText }),
        { status: response.status, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsed: { selectedRecipeId?: unknown; reasonRo?: unknown } | null = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    // The model answers with untrusted text. Only an id we ourselves offered is accepted, and
    // the explanation is capped before it leaves this function rather than only in the client.
    if (
      parsed &&
      typeof parsed.selectedRecipeId === 'string' &&
      payload.candidateRecipeIds.includes(parsed.selectedRecipeId)
    ) {
      return new Response(
        JSON.stringify({
          selectedRecipeId: parsed.selectedRecipeId,
          reasonRo:
            typeof parsed.reasonRo === 'string' && parsed.reasonRo.trim().length > 0
              ? parsed.reasonRo.trim().slice(0, 160)
              : 'Selecție optimă conform criteriilor stabilite.',
        }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // If hallucinated or invalid, return first candidate as safe fallback
    return new Response(
      JSON.stringify({
        selectedRecipeId: payload.candidateRecipeIds[0] || null,
        reasonRo: 'Selecție optimă conform criteriilor stabilite.',
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Eroare necunoscută la procesare';
    return new Response(
      JSON.stringify({ error: message, fallbackToLocal: true }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
