import { RECIPES, RECIPES_MAP } from '../recipes';
import { INGREDIENTS, INGREDIENTS_LIST } from '../ingredients';
import { SUPERMARKETS, SUPERMARKET_LIST } from '../supermarkets';
import { isPantryStaple, PANTRY_STAPLE_IDS } from '../pantryStaples';
import { SupermarketId } from '../../types';

describe('Data Catalog Integrity Tests (Phase 2)', () => {
  // HAPPY PATHS
  describe('Happy Path: Catalog Volumes & Properties', () => {
    it('contains at least 35 verified recipes adapted for Romania', () => {
      expect(RECIPES.length).toBeGreaterThanOrEqual(35);
      expect(Object.keys(RECIPES_MAP).length).toBe(RECIPES.length);
    });

    it('contains exactly 4 major Romanian supermarkets', () => {
      const validSupermarketIds: SupermarketId[] = ['lidl', 'kaufland', 'carrefour', 'mega_image'];
      expect(SUPERMARKET_LIST.length).toBe(4);
      validSupermarketIds.forEach((id) => {
        expect(SUPERMARKETS[id]).toBeDefined();
        expect(SUPERMARKETS[id].name.length).toBeGreaterThan(0);
        expect(SUPERMARKETS[id].brandColor.startsWith('#')).toBe(true);
      });
    });

    it('all ingredients have positive standard pack sizes and realistic prices across all 4 supermarkets', () => {
      expect(INGREDIENTS_LIST.length).toBeGreaterThanOrEqual(40);
      INGREDIENTS_LIST.forEach((ing) => {
        expect(ing.id).toBeTruthy();
        expect(ing.name).toBeTruthy();
        expect(ing.standardPackSize).toBeGreaterThan(0);
        expect(['g', 'ml', 'buc', 'legatura']).toContain(ing.unit);

        // Price checks across all 4 supermarkets
        const markets: SupermarketId[] = ['lidl', 'kaufland', 'carrefour', 'mega_image'];
        markets.forEach((m) => {
          expect(ing.typicalPriceRon[m]).toBeDefined();
          expect(ing.typicalPriceRon[m]).toBeGreaterThan(0);
          expect(ing.typicalPriceRon[m]).toBeLessThan(100); // realistic grocery pack price in RON
        });
      });
    });

    it('all recipes have valid nutritional values and non-empty steps', () => {
      RECIPES.forEach((recipe) => {
        expect(recipe.id).toBeTruthy();
        expect(recipe.title).toBeTruthy();
        expect(recipe.description).toBeTruthy();
        expect(recipe.prepTimeMinutes).toBeGreaterThanOrEqual(0);
        expect(recipe.cookTimeMinutes).toBeGreaterThanOrEqual(0);
        expect(recipe.nutritionPerServing.calories).toBeGreaterThan(200);
        expect(recipe.nutritionPerServing.proteinGrams).toBeGreaterThan(5);
        expect(recipe.nutritionPerServing.carbsGrams).toBeGreaterThanOrEqual(0);
        expect(recipe.nutritionPerServing.fatGrams).toBeGreaterThan(0);

        expect(recipe.ingredients.length).toBeGreaterThan(0);
        expect(recipe.steps.length).toBeGreaterThanOrEqual(3);

        recipe.steps.forEach((step, idx) => {
          expect(step.stepNumber).toBe(idx + 1);
          expect(step.instruction.length).toBeGreaterThan(15);
        });
      });
    });
  });

  // EDGE CASES
  describe('Edge Cases: Referential Integrity & Filter Constraints', () => {
    it('has ZERO orphan ingredient references (every recipe ingredient exists in INGREDIENTS)', () => {
      RECIPES.forEach((recipe) => {
        recipe.ingredients.forEach((ing) => {
          const match = INGREDIENTS[ing.ingredientId];
          expect(match).toBeDefined();
          expect(ing.amountPerServing).toBeGreaterThan(0);
        });
      });
    });

    it('every recipe has at least one valid appliance and at least one valid mood tag', () => {
      const validAppliances = ['hob', 'oven', 'air_fryer', 'microwave'];
      const validMoods = [
        'speedy',
        'low_calorie',
        'family_fav',
        'healthy_comfort',
        'fakeaway',
        'high_protein',
        'romanian_classic',
      ];

      RECIPES.forEach((recipe) => {
        expect(recipe.appliances.length).toBeGreaterThanOrEqual(1);
        recipe.appliances.forEach((app) => {
          expect(validAppliances).toContain(app);
        });

        expect(recipe.moodTags.length).toBeGreaterThanOrEqual(1);
        recipe.moodTags.forEach((mood) => {
          expect(validMoods).toContain(mood);
        });
      });
    });

    it('correctly distinguishes pantry staples and verifies isPantryStaple helper', () => {
      expect(PANTRY_STAPLE_IDS.length).toBeGreaterThan(0);
      expect(isPantryStaple('sare_fina')).toBe(true);
      expect(isPantryStaple('piper_negru')).toBe(true);
      expect(isPantryStaple('ulei_floarea_soarelui')).toBe(true);
      expect(isPantryStaple('piept_pui_file')).toBe(false);
      expect(isPantryStaple('file_somon_proaspat')).toBe(false);
    });
  });

  // ERROR & FALLBACK CASES
  describe('Error Cases & Missing Data Handling', () => {
    it('returns false/undefined gracefully for non-existent ingredient queries', () => {
      expect(isPantryStaple('ingredient_care_nu_exista')).toBe(false);
      expect(INGREDIENTS['ingredient_fantoma']).toBeUndefined();
      expect(RECIPES_MAP['reteta_inexistenta']).toBeUndefined();
    });

    it('ensures no recipe has duplicate ingredient IDs in its ingredient list', () => {
      RECIPES.forEach((recipe) => {
        const ids = recipe.ingredients.map((i) => i.ingredientId);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });
});
