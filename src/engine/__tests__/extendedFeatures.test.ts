import { areDietsCompatible, getIncompatibleDietsFor, isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { STORE_PRICE_INDEX } from '../../data/storePriceIndex';
import { aggregateGroceryList } from '../groceryAggregator';
import { INGREDIENTS } from '../../data/ingredients';
import { RECIPES } from '../../data/recipes';
import { SUPERMARKETS } from '../../data/supermarkets';
import { SupermarketId } from '../../types';

describe('Extended SmartMeal Features (8 Stores, Diets, Pricing, Pantry)', () => {
  describe('Supermarket Expansion to 8 Romanian Stores', () => {
    const allEightStores: SupermarketId[] = [
      'lidl',
      'kaufland',
      'carrefour',
      'mega_image',
      'auchan',
      'penny',
      'profi',
      'sezamo',
    ];

    it('defines all 8 supermarkets with complete metadata and colors', () => {
      expect(allEightStores.length).toBe(8);
      allEightStores.forEach((id) => {
        const store = SUPERMARKETS[id];
        expect(store).toBeDefined();
        expect(store.name).toBeTruthy();
        expect(store.tagline).toBeTruthy();
        expect(store.brandColor.startsWith('#')).toBe(true);
      });
    });

    it('prices every catalog ingredient at all 8 supermarkets', () => {
      const gaps: string[] = [];
      Object.values(INGREDIENTS).forEach((ingredient) => {
        allEightStores.forEach((storeId) => {
          const price = ingredient.typicalPriceRon[storeId];
          if (typeof price !== 'number' || price <= 0) {
            gaps.push(`${ingredient.id}@${storeId}`);
          }
        });
      });
      expect(gaps).toEqual([]);
    });

    it('applies benchmark retail multipliers across discounters, hypermarkets and delivery', () => {
      expect(STORE_PRICE_INDEX.penny.multiplier).toBeLessThan(STORE_PRICE_INDEX.lidl.multiplier);
      expect(STORE_PRICE_INDEX.lidl.multiplier).toBeLessThan(STORE_PRICE_INDEX.carrefour.multiplier);
      expect(STORE_PRICE_INDEX.carrefour.multiplier).toBeLessThan(STORE_PRICE_INDEX.mega_image.multiplier);
    });
  });

  describe('Multi-Diet Compatibility & Selection Logic', () => {
    it('correctly validates compatible diet pairs (up to 2)', () => {
      expect(areDietsCompatible('vegetarian', 'gluten_free')).toBe(true);
      expect(areDietsCompatible('vegan', 'gluten_free')).toBe(true);
      expect(areDietsCompatible('omnivore', 'gluten_free')).toBe(true);
      expect(areDietsCompatible('omnivore', 'keto')).toBe(true);
      expect(areDietsCompatible('pescatarian', 'keto')).toBe(true);
    });

    it('rejects contradictory or incompatible diet combinations', () => {
      expect(areDietsCompatible('omnivore', 'vegan')).toBe(false);
      expect(areDietsCompatible('omnivore', 'vegetarian')).toBe(false);
      expect(areDietsCompatible('vegan', 'pescatarian')).toBe(false);
      expect(areDietsCompatible('vegan', 'keto')).toBe(false);
    });

    it('returns the list of incompatible options for active selections', () => {
      const blockedForVegan = getIncompatibleDietsFor(['vegan']);
      expect(blockedForVegan.has('omnivore')).toBe(true);
      expect(blockedForVegan.has('vegetarian')).toBe(true);
      expect(blockedForVegan.has('pescatarian')).toBe(true);
      expect(blockedForVegan.has('gluten_free')).toBe(false);
    });

    it('filters recipes accurately when 2 diets are active (e.g. vegetarian + gluten-free)', () => {
      const chickenRecipe = RECIPES.find((r) => r.id === 'pui_airfryer_cartofi')!;
      const mamaligaRecipe = RECIPES.find((r) => r.id === 'mamaliga_branza_smantana')!;

      // Chicken is omnivore, so not matching vegetarian
      expect(isRecipeMatchingDiets(chickenRecipe, ['vegetarian'])).toBe(false);

      // Mamaliga has cornmeal (no gluten) and is vegetarian
      expect(isRecipeMatchingDiets(mamaligaRecipe, ['vegetarian', 'gluten_free'])).toBe(true);
    });
  });

  describe('Smart Home Pantry Inventory & Savings Calculation', () => {
    it('deducts items present in user pantry from cart purchase cost', () => {
      const sampleMeals = [
        { recipe: RECIPES.find((r) => r.id === 'mamaliga_branza_smantana')!, servings: 2 },
      ];

      // Without pantry inventory
      const initialGrocery = aggregateGroceryList(sampleMeals, 'lidl', false, [], []);
      const initialCost = initialGrocery.totalCartCostRon;

      // With pantry inventory containing malai
      const withPantry = aggregateGroceryList(
        sampleMeals,
        'lidl',
        false,
        [],
        ['malai_superior', 'sare_fina']
      );

      expect(withPantry.totalCartCostRon).toBeLessThan(initialCost);
      const malaiItem = withPantry.items.find((i) => i.ingredientId === 'malai_superior');
      expect(malaiItem?.isFromPantry).toBe(true);
      expect(malaiItem?.packsToBuy).toBe(0);
      expect(malaiItem?.estimatedPriceRon).toBe(0);
    });
  });
});
