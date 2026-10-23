import { Recipe, SupermarketId } from '../types';

/**
 * Badge colour for a store's signature dishes. One copy for the whole app: the swap modal's
 * own copy had drifted to four stores, so Auchan, Penny, Profi and Sezamo showed a blank badge.
 */
export function getStoreBadgeBg(store?: SupermarketId): string {
  switch (store) {
    case 'carrefour':
      return 'rgba(2, 132, 199, 0.9)';
    case 'kaufland':
      return 'rgba(220, 38, 38, 0.9)';
    case 'mega_image':
      return 'rgba(147, 51, 234, 0.9)';
    case 'lidl':
      return 'rgba(217, 119, 6, 0.9)';
    case 'auchan':
      return 'rgba(225, 29, 72, 0.9)';
    case 'penny':
      return 'rgba(185, 28, 28, 0.9)';
    case 'profi':
      return 'rgba(234, 88, 12, 0.9)';
    case 'sezamo':
      return 'rgba(21, 128, 61, 0.9)';
    default:
      return 'rgba(255, 255, 255, 0.2)';
  }
}

/**
 * The store-signature badge to show on a recipe, or null. Only for the store the user shops
 * at: a "Favorit Lidl" badge on a Kaufland plan advertised a shop the user had not chosen.
 */
export function getStoreSignatureBadge(
  recipe: Pick<Recipe, 'storeBadgeLabel' | 'storeSignature'>,
  supermarketId: SupermarketId
): { label: string; color: string } | null {
  if (!recipe.storeBadgeLabel || recipe.storeSignature !== supermarketId) return null;
  return { label: recipe.storeBadgeLabel, color: getStoreBadgeBg(recipe.storeSignature) };
}
