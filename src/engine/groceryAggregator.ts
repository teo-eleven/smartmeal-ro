import { AisleCategory, GroceryListItem, Recipe, SupermarketId } from '../types';
import { INGREDIENTS } from '../data/ingredients';

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
  excludePantryStaples: boolean = false
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
  ];

  const itemsByCategory: Record<AisleCategory, GroceryListItem[]> = {
    produce: [],
    meat_fish: [],
    dairy: [],
    pantry: [],
    canned_sauces: [],
    bakery: [],
    frozen: [],
  };

  for (const [ingredientId, { neededAmount, isStaple }] of Object.entries(ingredientMap)) {
    const dbIngredient = INGREDIENTS[ingredientId];
    if (!dbIngredient) continue;

    const packSize = dbIngredient.standardPackSize;
    const packPrice = dbIngredient.typicalPriceRon[supermarketId] ?? 0;

    // Minimum whole packs to purchase at the supermarket
    const packsToBuy = Math.ceil(neededAmount / packSize);
    const itemCost = Math.round(packsToBuy * packPrice * 100) / 100;

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
      isPurchased: false,
    };

    items.push(item);
    if (itemsByCategory[item.category]) {
      itemsByCategory[item.category].push(item);
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
