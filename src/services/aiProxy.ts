import { env } from '../../config/env';
import { Recipe, UserPreferences } from '../types';

export interface SmartSwapResult {
  recipe: Recipe;
  reason: string;
  isAiGenerated: boolean;
}

export const aiProxyService = {
  isAiAvailable(): boolean {
    return env.isAiConfigured;
  },

  async suggestSmartSwap(
    currentRecipe: Recipe,
    candidateRecipes: Recipe[],
    preferences: UserPreferences,
    userPrompt?: string
  ): Promise<SmartSwapResult> {
    const validCandidates = candidateRecipes.filter((r) => r.id !== currentRecipe.id);

    if (validCandidates.length === 0) {
      return {
        recipe: currentRecipe,
        reason: 'Nu există alte rețete compatibile cu filtrele actuale.',
        isAiGenerated: false,
      };
    }

    // Direct Gemini API call if client-side API key is set in development/staging
    if (env.geminiApiKey) {
      try {
        const candidateSummaries = validCandidates.map((r) => ({
          id: r.id,
          title: r.title,
          prepTimeMinutes: r.prepTimeMinutes,
          dietType: r.dietType,
          moodTags: r.moodTags,
        }));

        const promptText = `
Ești asistentul culinar inteligent SmartMeal RO.
Utilizatorul dorește să înlocuiască rețeta "${currentRecipe.title}" (moods: ${currentRecipe.moodTags.join(', ')}).
${userPrompt ? `Cerință specială utilizator: "${userPrompt}"` : 'Căutăm o alternativă echilibrată și gustoasă.'}

Rețete disponibile pentru înlocuire:
${JSON.stringify(candidateSummaries, null, 2)}

Alege cel mai potrivit ID de rețetă și explică de ce este o alegere excelentă în limba română (sub 15 cuvinte).
Răspunde DOAR cu JSON:
{"selectedId": "id_ales", "reasonRo": "explicatie scurta"}`;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.geminiApiKey}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const found = validCandidates.find((r) => r.id === parsed.selectedId);
            if (found) {
              return {
                recipe: found,
                reason: parsed.reasonRo || 'Alternativă inteligentă recomandată de AI.',
                isAiGenerated: true,
              };
            }
          }
        }
      } catch (err) {
        console.warn('[AIProxy] Gemini call failed, gracefully falling back to deterministic selection:', err);
      }
    }

    // Deterministic offline fallback: Match by user's mood tags and quick prep time
    const moodMatched = validCandidates.filter((r) =>
      r.moodTags.some((tag) => preferences.moodTags.includes(tag))
    );

    const chosen = moodMatched.length > 0 ? moodMatched[0] : validCandidates[0];

    return {
      recipe: chosen,
      reason: `Compatibilă cu preferințele tale (${chosen.prepTimeMinutes} min).`,
      isAiGenerated: false,
    };
  },
};
