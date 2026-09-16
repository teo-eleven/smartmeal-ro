import { INGREDIENTS } from './ingredients';
import { Ingredient } from '../types';

export const PANTRY_STAPLE_IDS: string[] = Object.keys(INGREDIENTS).filter(
  (id) => INGREDIENTS[id].isPantryStaple
);

export const PANTRY_STAPLES: Ingredient[] = PANTRY_STAPLE_IDS.map((id) => INGREDIENTS[id]);

export function isPantryStaple(ingredientId: string): boolean {
  return INGREDIENTS[ingredientId]?.isPantryStaple ?? false;
}
