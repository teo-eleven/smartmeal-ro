import { RECIPES } from '../../data/recipes';
import { DayOfWeek, UserPreferences } from '../../types';

const PROXY_URL = 'https://stub.supabase.co';

// The proxy path only runs when cloud sync is configured, which it is not in development.
// Mocking the config here is what makes that branch reachable at all.
jest.mock('../../../config/env', () => ({
  env: {
    port: 8081,
    appEnv: 'development',
    supabaseUrl: PROXY_URL,
    supabaseAnonKey: 'anon-key-stub',
    isAiProxyConfigured: true,
    isCloudSyncConfigured: true,
  },
}));

// The proxy now prices every call against a signed-in user's quota, so it asks Supabase for
// the session before it sends anything. Without a token it falls back deterministically --
// correct, but not the branch these tests are about.
jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'user-token-stub' } } }),
    },
  }),
}));

/* eslint-disable @typescript-eslint/no-require-imports */
const { aiProxyService } = require('../aiProxy');

const FULL_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function buildPreferences(): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: FULL_WEEK,
    budgetRon: 300,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
  };
}

const current = RECIPES[0];
const candidates = RECIPES.slice(1, 6);

describe('the request the client actually sends', () => {
  let fetchSpy: jest.Mock;

  beforeEach(() => {
    fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        selectedRecipeId: candidates[2].id,
        reasonRo: 'Rapidă și echilibrată.',
      }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => jest.restoreAllMocks());

  test('reports AI as available once the proxy is configured', () => {
    expect(aiProxyService.isAiAvailable()).toBe(true);
  });

  test('posts to the edge function, never to the model provider', async () => {
    await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${PROXY_URL}/functions/v1/proxy-gemini-plan`);
    expect(init.method).toBe('POST');
    expect(String(url)).not.toContain('googleapis');
  });

  test('sends only the candidate ids, not the whole catalog', async () => {
    await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.candidateRecipeIds).toEqual(candidates.map((r) => r.id));
    expect(body.currentMealId).toBe(current.id);
    expect(body.action).toBe('suggest_swap');
  });

  test('accepts a valid suggestion and marks it as AI generated', async () => {
    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    expect(result.recipe.id).toBe(candidates[2].id);
    expect(result.isAiGenerated).toBe(true);
    expect(result.reason).toBe('Rapidă și echilibrată.');
  });

  test('passes the user prompt through when there is one', async () => {
    await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences(), 'ceva mai ușor');

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.userPrompt).toBe('ceva mai ușor');
  });

  test('falls back deterministically when the proxy answers with an error status', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    expect(result.isAiGenerated).toBe(false);
    expect(candidates.map((c) => c.id)).toContain(result.recipe.id);
  });

  test('keeps an overlong model explanation from taking over the UI', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ selectedRecipeId: candidates[0].id, reasonRo: 'x'.repeat(500) }),
    });

    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    expect(result.reason.length).toBeLessThanOrEqual(160);
  });

  test('ignores an empty explanation in favour of a readable default', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ selectedRecipeId: candidates[0].id, reasonRo: '   ' }),
    });

    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    expect(result.reason.trim().length).toBeGreaterThan(0);
  });
});

describe('apelurile plătite cer un utilizator autentificat', () => {
  test('fără sesiune nu se atinge deloc funcția edge', async () => {
    jest.resetModules();
    jest.doMock('../supabase', () => ({
      getSupabaseClient: () => ({
        auth: { getSession: async () => ({ data: { session: null } }) },
      }),
    }));
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { aiProxyService: signedOut } = require('../aiProxy');

    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const prefs = buildPreferences();
    const result = await signedOut.suggestSmartSwap(RECIPES[0], [RECIPES[1], RECIPES[2]], prefs);

    expect(fetchSpy).not.toHaveBeenCalled();
    // The deterministic choice still comes from the candidates the caller pre-filtered.
    expect([RECIPES[1].id, RECIPES[2].id]).toContain(result.recipe.id);
    expect(result.isAiGenerated).toBe(false);
  });
});
