import { Recipe, SupermarketId } from '../types';

/**
 * The store-signature badge to show on a recipe, or null. Only for the store the user shops
 * at: a "Favorit Lidl" badge on a Kaufland plan advertised a shop the user had not chosen.
 * Its colour is the theme's `storeBadge`; the store's brand colour stays on its dot.
 */
export function getStoreSignatureBadge(
  recipe: Pick<Recipe, 'storeBadgeLabel' | 'storeSignature'>,
  supermarketId: SupermarketId
): { label: string } | null {
  if (!recipe.storeBadgeLabel || recipe.storeSignature !== supermarketId) return null;
  return { label: recipe.storeBadgeLabel };
}
