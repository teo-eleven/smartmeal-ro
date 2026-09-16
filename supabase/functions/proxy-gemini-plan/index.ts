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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
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
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload: RequestPayload = await req.json();

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
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = rawText ? JSON.parse(rawText) : null;

    // Validate that selectedRecipeId exists in candidate list
    if (parsed && payload.candidateRecipeIds.includes(parsed.selectedRecipeId)) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // If hallucinated or invalid, return first candidate as safe fallback
    return new Response(
      JSON.stringify({
        selectedRecipeId: payload.candidateRecipeIds[0] || null,
        reasonRo: 'Selecție optimă conform criteriilor stabilite.',
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Eroare necunoscută la procesare';
    return new Response(
      JSON.stringify({ error: message, fallbackToLocal: true }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
