import { env } from '../../config/env';
import { Recipe, UserPreferences } from '../types';

export interface SmartSwapResult {
  recipe: Recipe;
  reason: string;
  isAiGenerated: boolean;
}

const PROXY_FUNCTION_PATH = '/functions/v1/proxy-gemini-plan';
const PROXY_TIMEOUT_MS = 8000;

interface ProxyResponse {
  selectedRecipeId?: unknown;
  reasonRo?: unknown;
}

/**
 * Picks the deterministic replacement used whenever the model is unavailable, disagrees
 * with the catalog, or answers with something unusable.
 */
function pickDeterministicFallback(
  candidates: Recipe[],
  preferences: UserPreferences
): SmartSwapResult {
  const moodMatched = candidates.filter((recipe) =>
    recipe.moodTags.some((tag) => preferences.moodTags.includes(tag))
  );
  const chosen = moodMatched[0] || candidates[0];

  return {
    recipe: chosen,
    reason: `Compatibilă cu preferințele tale (${chosen.prepTimeMinutes} min).`,
    isAiGenerated: false,
  };
}

export const aiProxyService = {
  /**
   * AI runs behind the Supabase edge function, which holds the provider key server-side.
   * There is deliberately no client-side key path: an EXPO_PUBLIC_ variable is inlined
   * into the shipped bundle, so anyone could read it out of the app.
   */
  isAiAvailable(): boolean {
    return env.isAiProxyConfigured;
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

    if (!env.isAiProxyConfigured || !env.supabaseUrl) {
      return pickDeterministicFallback(validCandidates, preferences);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

      const response = await fetch(`${env.supabaseUrl}${PROXY_FUNCTION_PATH}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(env.supabaseAnonKey ? { Authorization: `Bearer ${env.supabaseAnonKey}` } : {}),
        },
        body: JSON.stringify({
          action: 'suggest_swap',
          peopleCount: preferences.peopleCount,
          budgetRon: preferences.budgetRon,
          supermarketId: preferences.supermarketId,
          dietType: preferences.dietType,
          appliances: preferences.appliances,
          moodTags: preferences.moodTags,
          candidateRecipeIds: validCandidates.map((r) => r.id),
          currentMealId: currentRecipe.id,
          userPrompt,
        }),
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        return pickDeterministicFallback(validCandidates, preferences);
      }

      const data: unknown = await response.json();

      // Model output is untrusted: the returned id only counts if it is one we offered.
      if (typeof data !== 'object' || data === null) {
        return pickDeterministicFallback(validCandidates, preferences);
      }

      const { selectedRecipeId, reasonRo } = data as ProxyResponse;
      const matched =
        typeof selectedRecipeId === 'string'
          ? validCandidates.find((r) => r.id === selectedRecipeId)
          : undefined;

      if (!matched) {
        return pickDeterministicFallback(validCandidates, preferences);
      }

      return {
        recipe: matched,
        reason:
          typeof reasonRo === 'string' && reasonRo.trim().length > 0
            ? reasonRo.trim().slice(0, 160)
            : 'Alternativă inteligentă recomandată de AI.',
        isAiGenerated: true,
      };
    } catch (err) {
      console.warn('[AIProxy] Proxy call failed, using deterministic selection:', err);
      return pickDeterministicFallback(validCandidates, preferences);
    }
  },
};
