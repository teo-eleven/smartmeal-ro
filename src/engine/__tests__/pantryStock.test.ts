import { aggregateGroceryList } from '../groceryAggregator';
import { INGREDIENTS } from '../../data/ingredients';
import { Recipe } from '../../types';

/** A one-ingredient recipe, so the pack maths is readable. */
function recipeNeeding(ingredientId: string, amountPerServing: number): Recipe {
  return {
    id: 'test',
    title: 'Test',
    description: '',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    dietType: 'omnivore',
    appliances: [],
    moodTags: [],
    nutritionPerServing: { calories: 1, proteinGrams: 1, carbsGrams: 1, fatGrams: 1 },
    ingredients: [
      { ingredientId, amountPerServing, unit: INGREDIENTS[ingredientId].unit },
    ],
    steps: [],
  };
}

const RICE = 'orez_basmati';
const packSize = INGREDIENTS[RICE].standardPackSize;
const packPrice = INGREDIENTS[RICE].typicalPriceRon.lidl;

const itemFor = (result: ReturnType<typeof aggregateGroceryList>) =>
  result.items.find((i) => i.ingredientId === RICE)!;

/**
 * The cart buys whole packs, so a recipe needing 270g of a 1kg bag leaves 730g at home. That
 * surplus was computed and thrown away; carrying it into the next week is the point of
 * `pantryStock`, which holds an amount rather than a yes/no like `pantryInventory`.
 */
describe('stocul din cămară scade din ce cumperi', () => {
  test('fără stoc, cumperi ambalaje întregi ca înainte', () => {
    const result = aggregateGroceryList([{ recipe: recipeNeeding(RICE, 100), servings: 2 }], 'lidl');

    expect(itemFor(result).packsToBuy).toBe(1);
  });

  test('stocul acoperă necesarul, deci nu cumperi nimic', () => {
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, 100), servings: 2 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: 500 }
    );
    const item = itemFor(result);

    expect(item.packsToBuy).toBe(0);
    expect(item.estimatedPriceRon).toBe(0);
    expect(result.totalCartCostRon).toBe(0);
  });

  test('stocul parțial reduce cumpărătura la diferență', () => {
    // Needs 2 × packSize, already has one pack's worth at home.
    const perServing = packSize;
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, perServing), servings: 2 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: packSize }
    );

    expect(itemFor(result).packsToBuy).toBe(1);
  });

  test('spune cât folosești din cămară', () => {
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, 100), servings: 2 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: 120 }
    );

    expect(itemFor(result).fromStockAmount).toBe(120);
  });

  test('spune cât îți rămâne după ce gătești', () => {
    const result = aggregateGroceryList([{ recipe: recipeNeeding(RICE, 135), servings: 2 }], 'lidl');
    const item = itemFor(result);

    // Buys one pack for 270g of need.
    expect(item.leftoverAmount).toBe(packSize - 270);
  });

  test('surplusul ține cont și de ce era deja în cămară', () => {
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, 100), servings: 2 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: 500 }
    );

    expect(itemFor(result).leftoverAmount).toBe(300);
  });

  test('un stoc mai mare decât ambalajul nu produce cumpărături negative', () => {
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, 10), servings: 1 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: packSize * 5 }
    );
    const item = itemFor(result);

    expect(item.packsToBuy).toBe(0);
    expect(item.leftoverAmount).toBe(packSize * 5 - 10);
  });

  test('bifa veche „am deja acasă" continuă să funcționeze', () => {
    const result = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, 100), servings: 2 }],
      'lidl',
      false,
      [],
      [RICE]
    );
    const item = itemFor(result);

    expect(item.packsToBuy).toBe(0);
    expect(item.isFromPantry).toBe(true);
  });

  test('totalul coșului scade cu exact prețul ambalajelor economisite', () => {
    const without = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, packSize), servings: 2 }],
      'lidl'
    );
    const withStock = aggregateGroceryList(
      [{ recipe: recipeNeeding(RICE, packSize), servings: 2 }],
      'lidl',
      false,
      [],
      [],
      { [RICE]: packSize }
    );

    expect(without.totalCartCostRon - withStock.totalCartCostRon).toBeCloseTo(packPrice, 2);
  });
});
