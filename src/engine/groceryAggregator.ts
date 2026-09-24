import { AisleCategory, GroceryListItem, Recipe, SupermarketId } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { RETAIL_PRODUCTS_MAP } from '../data/retailProducts';

export interface AggregatedGroceryResult {
  items: GroceryListItem[];
  itemsByCategory: Record<AisleCategory, GroceryListItem[]>;
  totalCartCostRon: number;
  totalRecipePortionCostRon: number;
  totalItemsCount: number;
}

export function aggregateGroceryList(
  meals: { recipe: Recipe; servings: number }[],
  supermarketId: SupermarketId,
  excludePantryStaples: boolean = false,
  extraProductIds: string[] = [],
  pantryInventory: string[] = [],
  /** Amounts already at home, in each ingredient's own unit. */
  pantryStock: Record<string, number> = {}
): AggregatedGroceryResult {
  const ingredientMap: Record<
    string,
    {
      neededAmount: number;
      isStaple: boolean;
    }
  > = {};

  let totalRecipePortionCostRon = 0;

  // 1. Accumulate needed amounts across all recipes
  for (const { recipe, servings } of meals) {
    for (const ing of recipe.ingredients) {
      const dbIngredient = INGREDIENTS[ing.ingredientId];
      if (!dbIngredient) continue;

      const isStaple = dbIngredient.isPantryStaple;
      if (excludePantryStaples && isStaple) continue;

      const requiredForMeal = ing.amountPerServing * servings;

      if (!ingredientMap[ing.ingredientId]) {
        ingredientMap[ing.ingredientId] = {
          neededAmount: 0,
          isStaple,
        };
      }
      ingredientMap[ing.ingredientId].neededAmount += requiredForMeal;

      // Fractional portion cost
      const packPrice = dbIngredient.typicalPriceRon[supermarketId] ?? 0;
      const portionFraction = requiredForMeal / dbIngredient.standardPackSize;
      totalRecipePortionCostRon += portionFraction * packPrice;
    }
  }

  // 2. Convert to whole supermarket packages and build items
  const items: GroceryListItem[] = [];
  let totalCartCostRon = 0;

  const categoriesOrder: AisleCategory[] = [
    'produce',
    'meat_fish',
    'dairy',
    'pantry',
    'canned_sauces',
    'bakery',
    'frozen',
    'snacks',
    'beverages',
    'alcohol',
  ];

  const itemsByCategory: Record<AisleCategory, GroceryListItem[]> = {
    produce: [],
    meat_fish: [],
    dairy: [],
    pantry: [],
    canned_sauces: [],
    bakery: [],
    frozen: [],
    snacks: [],
    beverages: [],
    alcohol: [],
  };

  for (const [ingredientId, { neededAmount, isStaple }] of Object.entries(ingredientMap)) {
    const dbIngredient = INGREDIENTS[ingredientId];
    if (!dbIngredient) continue;

    const packSize = dbIngredient.standardPackSize;
    const packPrice = dbIngredient.typicalPriceRon[supermarketId] ?? 0;
    const isFromPantry = pantryInventory.includes(ingredientId);

    // What is already in the cupboard is used first; only the shortfall is bought, and it is
    // still bought in whole packs because that is how a supermarket sells it.
    const stocked = isFromPantry ? neededAmount : Math.max(0, pantryStock[ingredientId] ?? 0);
    const fromStockAmount = Math.min(stocked, neededAmount);
    const outstanding = Math.max(0, neededAmount - stocked);

    const packsToBuy = outstanding > 0 ? Math.ceil(outstanding / packSize) : 0;
    const itemCost = Math.round(packsToBuy * packPrice * 100) / 100;

    // What this week will not use up, and therefore what next week can start from.
    const leftoverAmount =
      Math.round((stocked + packsToBuy * packSize - neededAmount) * 10) / 10;

    totalCartCostRon += itemCost;

    const item: GroceryListItem = {
      ingredientId,
      name: dbIngredient.name,
      category: dbIngredient.category,
      isPantryStaple: isStaple,
      neededAmount: Math.round(neededAmount * 10) / 10,
      unit: dbIngredient.unit,
      packsToBuy,
      packSize,
      estimatedPriceRon: itemCost,
      isPurchased: isFromPantry,
      isFromPantry,
      fromStockAmount: Math.round(fromStockAmount * 10) / 10,
      leftoverAmount: Math.max(0, leftoverAmount),
    };

    items.push(item);
    if (itemsByCategory[item.category]) {
      itemsByCategory[item.category].push(item);
    }
  }

  // 3. Add extra retail products (snacks, sweets, soft & alcoholic drinks)
  if (extraProductIds && extraProductIds.length > 0) {
    for (const prodId of extraProductIds) {
      const product = RETAIL_PRODUCTS_MAP[prodId];
      if (!product) continue;

      const prodPrice = product.typicalPriceRon[supermarketId] ?? 0;
      totalCartCostRon += prodPrice;

      let cat: AisleCategory = 'snacks';
      if (product.category === 'drink_soft') {
        cat = 'beverages';
      } else if (product.category === 'drink_alcoholic') {
        cat = 'alcohol';
      }

      const retailItem: GroceryListItem = {
        ingredientId: product.id,
        name: `${product.icon} ${product.name} (${product.brand}, ${product.packageSize})`,
        category: cat,
        isPantryStaple: false,
        neededAmount: 1,
        unit: 'buc',
        packsToBuy: 1,
        packSize: 1,
        estimatedPriceRon: prodPrice,
        isPurchased: false,
      };

      items.push(retailItem);
      if (itemsByCategory[cat]) {
        itemsByCategory[cat].push(retailItem);
      }
    }
  }

  // Sort items alphabetically within each category
  categoriesOrder.forEach((cat) => {
    itemsByCategory[cat].sort((a, b) => a.name.localeCompare(b.name, 'ro'));
  });

  return {
    items,
    itemsByCategory,
    totalCartCostRon: Math.round(totalCartCostRon * 100) / 100,
    totalRecipePortionCostRon: Math.round(totalRecipePortionCostRon * 100) / 100,
    totalItemsCount: items.length,
  };
}
