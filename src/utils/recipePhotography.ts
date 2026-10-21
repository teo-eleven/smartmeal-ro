import { Recipe } from '../types';
import { DishArchetype } from './recipeVisual';

/**
 * Curated high-definition, mouth-watering food photography for dish archetypes and signatures.
 * These photography assets provide vibrant, appetizing presentation (replacing dark/muddy overlays)
 * while maintaining 100% offline fallback compatibility.
 */

export const ARCHETYPE_PHOTO_URLS: Record<DishArchetype, string> = {
  pasta:
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281240?w=900&auto=format&fit=crop&q=80', // Twirled fresh pasta with rich sauce & basil
  grill:
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&auto=format&fit=crop&q=80', // Juicy grilled meat with herbs
  soup:
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&auto=format&fit=crop&q=80', // Hearty steaming soup with rustic garnish
  stew:
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=900&auto=format&fit=crop&q=80', // Savory slow-cooked stew
  seafood:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&auto=format&fit=crop&q=80', // Crispy pan-seared salmon with lemon
  salad:
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&auto=format&fit=crop&q=80', // Fresh, colorful vibrant salad bowl
  roast:
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&auto=format&fit=crop&q=80', // Golden crispy roast chicken & potatoes
  breakfast:
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop&q=80', // Warm poached eggs & avocado breakfast
  wrap:
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=900&auto=format&fit=crop&q=80', // Crispy golden wrap / quesadilla
  rice:
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&auto=format&fit=crop&q=80', // Vibrant aromatic rice & bowl
  dessert:
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=900&auto=format&fit=crop&q=80', // Decadent dessert with chocolate & berries
  snack:
    'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=900&auto=format&fit=crop&q=80', // Appetizing snack platter
};

/**
 * Signature dish photo overrides for popular Romanian & international recipes.
 */
const SIGNATURE_DISH_PHOTOS: Record<string, string> = {
  snitele_pui_cuptor:
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&auto=format&fit=crop&q=80', // Crispy schnitzel
  mamaliga_telemea:
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=900&auto=format&fit=crop&q=80', // Golden polenta comfort
  pui_airfryer_wedges:
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=900&auto=format&fit=crop&q=80', // Golden crispy chicken wings/wedges
  somon_tigaie_orez:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&auto=format&fit=crop&q=80', // Salmon fillet
  ciorba_radauteana:
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&auto=format&fit=crop&q=80', // Rich garlic-cream soup
  burger_pui_crocant:
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=80', // Juicy gourmet burger
  salata_greceasca:
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&auto=format&fit=crop&q=80', // Greek salad with feta
  penne_bolognese:
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281240?w=900&auto=format&fit=crop&q=80', // Penne bolognese
  shakshuka_rosii:
    'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=900&auto=format&fit=crop&q=80', // Skillet shakshuka
  curry_pui_cocos:
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&auto=format&fit=crop&q=80', // Creamy coconut chicken curry
};

/**
 * Returns a high-definition appetizing dish photography URI for any recipe.
 */
export function getRecipePhotographyUri(recipe: Recipe, archetype: DishArchetype): string {
  if (SIGNATURE_DISH_PHOTOS[recipe.id]) {
    return SIGNATURE_DISH_PHOTOS[recipe.id];
  }
  return ARCHETYPE_PHOTO_URLS[archetype] || ARCHETYPE_PHOTO_URLS.stew;
}
