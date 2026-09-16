import { storageService } from '../storage';
import { cloudSyncService } from '../supabase';
import { aiProxyService } from '../aiProxy';
import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';
import { UserPreferences, MealPlan } from '../../types';

describe('Phase 8: Offline Storage, Cloud Sync & AI Proxy Services', () => {
  beforeEach(async () => {
    await storageService.clearAll();
    useAppStore.getState().resetOnboarding();
  });

  describe('Storage Hydration & Store Integration', () => {
    it('hydrates store state from local storage on launch', async () => {
      const customPrefs: UserPreferences = {
        supermarketId: 'kaufland',
        peopleCount: 4,
        cookingDays: ['tuesday', 'thursday', 'saturday'],
        mealSlots: ['dinner'],
        budgetRon: 240,
        moodTags: ['high_protein', 'speedy'],
        dietType: 'omnivore',
        appliances: ['hob', 'oven', 'air_fryer'],
        excludePantryStaples: true,
      };

      const samplePlan: MealPlan = {
        id: 'test-plan-1',
        createdAt: new Date().toISOString(),
        supermarketId: 'kaufland',
        peopleCount: 4,
        totalBudgetRon: 240,
        totalRecipeCostRon: 180,
        totalCartCostRon: 210,
        days: [
          {
            dayOfWeek: 'tuesday',
            recipe: RECIPES[0],
            servings: 4,
            estimatedCostRon: 45,
            meals: [
              {
                id: 'tuesday-dinner',
                slot: 'dinner',
                slotLabelRo: 'Cină',
                recipe: RECIPES[0],
                servings: 4,
                estimatedCostRon: 45,
              },
            ],
          },
        ],
      };

      const sampleItems = [
        {
          ingredientId: 'piept_pui_file',
          name: 'Piept de pui file',
          category: 'meat_fish' as const,
          neededAmount: 500,
          unit: 'g' as const,
          packSize: 500,
          packsToBuy: 1,
          estimatedPriceRon: 16.5,
          isPurchased: false,
          isPantryStaple: false,
        },
      ];

      await storageService.savePreferences(customPrefs);
      await storageService.savePlanAndGrocery(samplePlan, sampleItems);

      // Trigger store hydration
      await useAppStore.getState().hydrateStorage();

      const state = useAppStore.getState();
      expect(state.isHydrated).toBe(true);
      expect(state.preferences.supermarketId).toBe('kaufland');
      expect(state.preferences.peopleCount).toBe(4);
      expect(state.currentPlan?.id).toBe('test-plan-1');
      expect(state.groceryItems.length).toBe(1);
      expect(state.activeView).toBe('meals');
    });
  });

  describe('Cloud Sync Service (Guest Mode & Unconfigured Fallback)', () => {
    it('reports offline/guest state gracefully when credentials are not configured', async () => {
      const isConfigured = cloudSyncService.isConfigured();
      expect(typeof isConfigured).toBe('boolean');

      const user = await cloudSyncService.getCurrentUser();
      expect(user).toBeNull();

      const saveRes = await cloudSyncService.saveMealPlan('guest@test.ro', null, []);
      expect(saveRes.success).toBe(false);
      expect(saveRes.error).toBeDefined();

      const loadRes = await cloudSyncService.loadMealPlan('guest@test.ro');
      expect(loadRes.plan).toBeNull();
    });
  });

  describe('AI Proxy Service (Smart Swap & Deterministic Fallback)', () => {
    it('reliably returns a smart swap candidate matching criteria', async () => {
      const current = RECIPES[0];
      const candidates = RECIPES.slice(1, 5);
      const prefs = useAppStore.getState().preferences;

      const result = await aiProxyService.suggestSmartSwap(current, candidates, prefs);

      expect(result.recipe).toBeDefined();
      expect(result.recipe.id).not.toBe(current.id);
      expect(candidates.some((c) => c.id === result.recipe.id)).toBe(true);
      expect(result.reason.length).toBeGreaterThan(5);
    });

    it('handles empty candidate lists safely without crashing', async () => {
      const current = RECIPES[0];
      const prefs = useAppStore.getState().preferences;

      const result = await aiProxyService.suggestSmartSwap(current, [], prefs);

      expect(result.recipe.id).toBe(current.id);
      expect(result.isAiGenerated).toBe(false);
    });
  });
});
