import { INGREDIENTS } from '../../data/ingredients';
import { shoppingAmount } from '../../engine/ingredientUnits';
import { Appliance, Recipe, SupermarketId } from '../../types';

export const APPLIANCE_MAP: Record<Appliance, { name: string; icon: string }> = {
  hob: { name: 'Plită / Tigaie', icon: '🍳' },
  oven: { name: 'Cuptor', icon: '♨️' },
  air_fryer: { name: 'Air Fryer', icon: '🍟' },
  microwave: { name: 'Microunde', icon: '📻' },
};

export function getChefTipsForRecipe(recipe: Recipe): string[] {
  const tips: string[] = [];
  if (recipe.prepTimeMinutes <= 10) {
    tips.push(
      '⚡ Rețetă rapidă: pregătește toate ingredientele pe blat înainte de a aprinde focul (mise en place).'
    );
  }
  if (recipe.appliances.includes('oven')) {
    tips.push(
      '♨️ Preîncălzește cuptorul cu 10-15 minute înainte pentru rumenire aurie și textură crocantă.'
    );
  }
  if (recipe.appliances.includes('hob')) {
    tips.push(
      '🍳 Încinge tigaia bine înainte de a adăuga uleiul pentru a sigila sucurile și aromele.'
    );
  }
  if (recipe.suitableSlots?.includes('dessert')) {
    tips.push(
      '🍰 Lasă desertul să se tempereze 5 minute înainte de servire pentru consistență cremoasă.'
    );
  }
  if (tips.length === 0) {
    tips.push(
      '🧂 Gustă sosul spre final și ajustează sarea și piperul proaspăt măcinat după preferință.'
    );
  }
  tips.push(
    '💡 Păstrează porțiile rămase într-o caserolă etanșă la rece — aromele se întrepătrund excelent până a doua zi.'
  );
  return tips;
}

export function getSubstitutionsForRecipe(
  recipe: Recipe
): { original: string; substitute: string }[] {
  const subs: { original: string; substitute: string }[] = [];
  recipe.ingredients.forEach((ing) => {
    if (ing.ingredientId.includes('smantana') || ing.ingredientId.includes('iaurt')) {
      subs.push({
        original: 'Smântână / Iaurt',
        substitute: 'Iaurt grecesc 10% sau cremă vegetală',
      });
    } else if (ing.ingredientId.includes('unt')) {
      subs.push({ original: 'Unt', substitute: 'Ulei de măsline extravirgin' });
    } else if (ing.ingredientId.includes('piept_pui')) {
      subs.push({ original: 'Piept de pui', substitute: 'Pulpă de pui dezosată sau tofu marinat' });
    } else if (ing.ingredientId.includes('orez')) {
      subs.push({ original: 'Orez', substitute: 'Quinoa sau bulgur' });
    } else if (ing.ingredientId.includes('paste')) {
      subs.push({ original: 'Paste făinoase', substitute: 'Paste integrale sau tăiței de orez' });
    }
  });
  if (subs.length === 0) {
    subs.push({
      original: 'Condimente',
      substitute: 'Boia dulce afumată, oregano uscat sau cimbru după gust',
    });
  }
  return subs.slice(0, 2);
}

/** Live cost of one portion and of the whole pot, at the chosen supermarket's prices. */
export function estimateRecipeCost(
  recipe: Recipe,
  supermarketId: SupermarketId,
  activeServings: number
): { formattedCostPerServing: string; formattedTotalCost: string } {
  const estimatedCostPerServing = recipe.ingredients.reduce((acc, ing) => {
    const item = INGREDIENTS[ing.ingredientId];
    if (!item) return acc;
    const unitPrice = (item.typicalPriceRon[supermarketId] ?? 5) / (item.standardPackSize || 100);
    return acc + unitPrice * shoppingAmount(ing, item);
  }, 0);
  const formattedCostPerServing = Math.max(
    3.5,
    Math.round(estimatedCostPerServing * 10) / 10
  ).toFixed(2);
  const formattedTotalCost = (parseFloat(formattedCostPerServing) * activeServings).toFixed(2);
  return { formattedCostPerServing, formattedTotalCost };
}
