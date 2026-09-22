import { aiProxyService } from '../aiProxy';
import { RECIPES } from '../../data/recipes';
import { DayOfWeek, UserPreferences } from '../../types';

const WORK_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function buildPreferences(): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: WORK_WEEK,
    budgetRon: 300,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
  };
}

const current = RECIPES[0];
const candidates = RECIPES.slice(1, 6);

describe('the client never talks to the model provider directly', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('exposes no API key to the bundle', () => {
    // Arrange & Act
    const source = JSON.stringify(aiProxyService);

    // Assert
    expect(source).not.toMatch(/AIza/);
    expect(aiProxyService).not.toHaveProperty('apiKey');
  });

  test('never calls googleapis.com from the client', async () => {
    // Arrange
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ selectedRecipeId: candidates[0].id, reasonRo: 'ok' }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;

    // Act
    await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    // Assert
    fetchSpy.mock.calls.forEach(([url]) => {
      expect(String(url)).not.toContain('googleapis.com');
    });
  });

  test('falls back deterministically when the proxy is unreachable', async () => {
    // Arrange
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    // Act
    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    // Assert
    expect(result.isAiGenerated).toBe(false);
    expect(candidates.map((c) => c.id)).toContain(result.recipe.id);
  });

  test('rejects a recipe id the model invented', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ selectedRecipeId: 'reteta_inventata_care_nu_exista', reasonRo: 'x' }),
    }) as unknown as typeof fetch;

    // Act
    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    // Assert
    expect(candidates.map((c) => c.id)).toContain(result.recipe.id);
    expect(result.isAiGenerated).toBe(false);
  });

  test('rejects a malformed proxy response instead of crashing', async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => 'not an object',
    }) as unknown as typeof fetch;

    // Act
    const result = await aiProxyService.suggestSmartSwap(current, candidates, buildPreferences());

    // Assert
    expect(result.recipe).toBeTruthy();
    expect(result.isAiGenerated).toBe(false);
  });

  test('returns the current recipe when there is nothing to swap to', async () => {
    // Act
    const result = await aiProxyService.suggestSmartSwap(current, [], buildPreferences());

    // Assert
    expect(result.recipe.id).toBe(current.id);
    expect(result.isAiGenerated).toBe(false);
  });
});
