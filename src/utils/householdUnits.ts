import { MeasurementUnit } from '../types';

/**
 * Returns practical Romanian kitchen household equivalents for recipe ingredients.
 * Examples:
 * - 150g tomato sauce -> "150 g (aprox. 1 cană)"
 * - 15g olive oil -> "15 g (aprox. 1 lingură)"
 * - 5g garlic -> "5 g (1 cățel)"
 * - 100g mushrooms -> "100 g (aprox. 1/2 caserolă)"
 * - 150g onion -> "150 g (1 bucată medie)"
 */
export function getHouseholdEquivalent(
  ingredientId: string,
  amount: number,
  unit: MeasurementUnit
): string | null {
  if (amount <= 0) return null;

  const id = ingredientId.toLowerCase();

  // If unit is already buc, legatura, lingura, lingurita, no extra conversion needed
  if (unit === 'buc' || unit === 'legatura' || unit === 'lingura' || unit === 'lingurita') {
    return null;
  }

  // Garlic cloves
  if (id.includes('usturoi')) {
    const cloves = Math.max(1, Math.round(amount / 5));
    return cloves === 1 ? '1 cățel' : `aprox. ${cloves} căței`;
  }

  // Single count produce items usually sold/cooked as pieces
  if (
    id.includes('avocado') ||
    id.includes('ceapa') ||
    id.includes('lamaie') ||
    id.includes('mar_') ||
    id.includes('mere') ||
    id.includes('banana') ||
    id.includes('cartof') ||
    id.includes('dovlecel') ||
    id.includes('ardei')
  ) {
    const pieces = Math.round((amount / 130) * 10) / 10;
    if (pieces >= 0.8 && pieces <= 1.2) return '1 buc. medie';
    if (pieces >= 1.8 && pieces <= 2.2) return '2 bucăți';
    if (pieces >= 2.8 && pieces <= 3.2) return '3 bucăți';
    if (pieces <= 0.6) return 'aprox. 1/2 buc.';
    return `aprox. ${Math.round(pieces)} buc.`;
  }

  // Eggs (if measured in grams)
  if (id.includes('oua') || id.includes('ou_')) {
    const eggCount = Math.max(1, Math.round(amount / 55));
    return eggCount === 1 ? '1 ou' : `${eggCount} ouă`;
  }

  // Packaged mushrooms or berries (usually 250g caserolă)
  if (
    id.includes('ciuperci') ||
    id.includes('afine') ||
    id.includes('capsuni') ||
    id.includes('zmeura') ||
    id.includes('rosii_cherry')
  ) {
    if (amount >= 200 && amount <= 280) return '1 caserolă';
    if (amount >= 90 && amount <= 150) return 'aprox. 1/2 caserolă';
    if (amount >= 450 && amount <= 550) return '2 caserole';
  }

  // Liquids, sauces, dairy, broths (cups vs tablespoons)
  if (
    id.includes('lapte') ||
    id.includes('apa') ||
    id.includes('supa') ||
    id.includes('sos') ||
    id.includes('smantana') ||
    id.includes('iaurt') ||
    id.includes('bulion') ||
    id.includes('rosii_pasate')
  ) {
    if (amount >= 180 && amount <= 270) return 'aprox. 1 cană';
    if (amount >= 90 && amount <= 140) return 'aprox. 1/2 cană';
    if (amount >= 350 && amount <= 520) return 'aprox. 2 căni';
    if (amount >= 25 && amount < 90) {
      const tbsp = Math.round(amount / 15);
      return `aprox. ${tbsp} linguri`;
    }
    if (amount >= 10 && amount < 25) return 'aprox. 1 lingură';
    if (amount < 10) return 'aprox. 1 linguriță';
  }

  // Oils, butter, honey, vinegar, mustard
  if (
    id.includes('ulei') ||
    id.includes('unt') ||
    id.includes('miere') ||
    id.includes('otet') ||
    id.includes('mustar') ||
    id.includes('pasta_tomate')
  ) {
    if (amount >= 25) {
      const tbsp = Math.round(amount / 15);
      return `aprox. ${tbsp} linguri`;
    }
    if (amount >= 10 && amount < 25) return 'aprox. 1 lingură';
    if (amount >= 4 && amount < 10) return 'aprox. 1 linguriță';
  }

  // Grains, pasta, flour, oats, rice (cups / tablespoons)
  if (
    id.includes('orez') ||
    id.includes('faina') ||
    id.includes('paste') ||
    id.includes('ovaz') ||
    id.includes('quinoa') ||
    id.includes('cuscus') ||
    id.includes('gris') ||
    id.includes('malai')
  ) {
    if (amount >= 160 && amount <= 240) return 'aprox. 1 cană';
    if (amount >= 80 && amount <= 130) return 'aprox. 1/2 cană';
    if (amount >= 25 && amount < 80) {
      const tbsp = Math.round(amount / 20);
      return `aprox. ${tbsp} linguri pline`;
    }
  }

  // Grated cheese, seeds, nuts, spices
  if (
    id.includes('parmezan') ||
    id.includes('seminte') ||
    id.includes('nuci') ||
    id.includes('migdale') ||
    id.includes('cacao')
  ) {
    if (amount >= 25) {
      const tbsp = Math.round(amount / 15);
      return `aprox. ${tbsp} linguri`;
    }
    if (amount >= 10 && amount < 25) return 'aprox. 1 lingură';
    if (amount >= 3 && amount < 10) return 'aprox. 1 linguriță';
  }

  return null;
}

/**
 * Returns formatted text including metric amount and household unit.
 * e.g. "150 g (aprox. 1 cană)"
 */
export function formatIngredientWithHousehold(
  ingredientId: string,
  amount: number,
  unit: MeasurementUnit
): string {
  const equiv = getHouseholdEquivalent(ingredientId, amount, unit);
  if (equiv) {
    return `${amount} ${unit} (${equiv})`;
  }
  return `${amount} ${unit}`;
}
