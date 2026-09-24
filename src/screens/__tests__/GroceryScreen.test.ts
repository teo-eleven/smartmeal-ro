import { storageService } from '../../services/storage';
import { parseUserPreferences } from '../../utils/preferencesValidation';
import { useAppStore } from '../../store/useAppStore';
import { aggregateGroceryList } from '../../engine/groceryAggregator';
import { RECIPES } from '../../data/recipes';

describe('Grocery Screen & Storage Integration (Phase 6)', () => {
  beforeEach(async () => {
    await storageService.clearAll();
    useAppStore.getState().resetOnboarding();
  });

  it('saves and loads preferences from storageService', async () => {
    const prefs = useAppStore.getState().preferences;
    await storageService.savePreferences(prefs);

    // loadPreferences returns the raw stored value now; the store validates it.
    const loaded = parseUserPreferences(await storageService.loadPreferences(), prefs);
    expect(loaded.supermarketId).toBe(prefs.supermarketId);
    expect(loaded.peopleCount).toBe(prefs.peopleCount);
  });

  it('saves and loads plan and grocery items from storageService', async () => {
    const store = useAppStore.getState();
    store.generatePlan();

    const plan = useAppStore.getState().currentPlan;
    const items = useAppStore.getState().groceryItems;

    await storageService.savePlanAndGrocery(plan, items);

    const loaded = await storageService.loadPlanAndGrocery();
    expect(loaded.plan).not.toBeNull();
    expect(loaded.plan?.days.length).toBe(plan?.days.length);
    expect(loaded.items.length).toBe(items.length);
  });

  it('correctly categorizes ingredients across all supermarket aisles', () => {
    const sampleMeals = [
      { recipe: RECIPES[0], servings: 2 }, // meat, produce, pantry
      { recipe: RECIPES[1], servings: 2 }, // dairy, pantry
      { recipe: RECIPES[3], servings: 2 }, // fish, produce
    ];

    const result = aggregateGroceryList(sampleMeals, 'lidl', false);

    // Verify aisles are populated
    expect(result.itemsByCategory.produce.length).toBeGreaterThan(0);
    expect(result.itemsByCategory.dairy.length).toBeGreaterThan(0);
    expect(result.itemsByCategory.pantry.length).toBeGreaterThan(0);
    expect(result.itemsByCategory.meat_fish.length).toBeGreaterThan(0);

    // Verify each item has positive packaging calculation
    result.items.forEach((item) => {
      expect(item.packsToBuy).toBeGreaterThanOrEqual(1);
      expect(item.estimatedPriceRon).toBeGreaterThan(0);
      expect(item.neededAmount).toBeGreaterThan(0);
    });
  });

  it('toggling pantry staples alters the grocery list item count and total cart price', () => {
    const sampleMeals = [{ recipe: RECIPES[0], servings: 2 }];

    const withStaples = aggregateGroceryList(sampleMeals, 'lidl', false);
    const withoutStaples = aggregateGroceryList(sampleMeals, 'lidl', true);

    expect(withStaples.items.length).toBeGreaterThan(withoutStaples.items.length);
    expect(withStaples.totalCartCostRon).toBeGreaterThan(withoutStaples.totalCartCostRon);
  });
});
