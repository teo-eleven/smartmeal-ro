import { Allergen } from '../types';

export interface AllergenInfo {
  id: Allergen;
  label: string;
  icon: string;
  /** What the user actually avoids, in their own words. */
  description: string;
}

/**
 * The subset of the EU's 14 declarable allergens that this ingredient catalog can actually
 * contain. Adding an allergen here without mapping the ingredients that carry it would be
 * worse than not offering it at all, so the two are kept side by side in this file.
 */
export const ALLERGEN_CATALOG: AllergenInfo[] = [
  {
    id: 'gluten',
    label: 'Gluten',
    icon: '🌾',
    description: 'Grâu, pâine, paste, pesmet, biscuiți',
  },
  { id: 'lactate', label: 'Lactate', icon: '🥛', description: 'Lapte, brânză, smântână, unt' },
  { id: 'oua', label: 'Ouă', icon: '🥚', description: 'Ouă și preparate care le conțin' },
  { id: 'peste', label: 'Pește', icon: '🐟', description: 'Somon, dorada, ton' },
  { id: 'crustacee', label: 'Crustacee', icon: '🦐', description: 'Creveți și fructe de mare' },
  { id: 'nuci', label: 'Nuci', icon: '🌰', description: 'Miez de nucă și fructe oleaginoase' },
  { id: 'arahide', label: 'Arahide', icon: '🥜', description: 'Arahide și unt de arahide' },
  { id: 'soia', label: 'Soia', icon: '🫘', description: 'Sos de soia și derivate' },
  { id: 'susan', label: 'Susan', icon: '🫓', description: 'Semințe de susan și hummus' },
  { id: 'mustar', label: 'Muștar', icon: '🟡', description: 'Muștar și sosuri cu muștar' },
];

/**
 * Ingredient -> allergens it carries. Only ingredients that carry at least one appear.
 *
 * An omission here means a user who declared an allergy is served the allergen anyway, so
 * every new ingredient must be checked against this map.
 */
export const INGREDIENT_ALLERGENS: Record<string, Allergen[]> = {
  // Gluten
  paste_penne: ['gluten'],
  paste_spaghete: ['gluten'],
  faina_alba: ['gluten'],
  faina_grau: ['gluten'],
  pesmet_auriu: ['gluten'],
  paine_toast: ['gluten'],
  chifle_burger: ['gluten'],
  lipii_tortilla: ['gluten'],
  biscuiti_populari: ['gluten', 'lactate'],
  fulgi_ovaz: ['gluten'],
  bors_proaspat: ['gluten'],

  // Dairy
  lapte_3_5: ['lactate'],
  branza_vaci_proaspata: ['lactate'],
  telemea_vaca: ['lactate'],
  smantana_20: ['lactate'],
  smantana_gatit: ['lactate'],
  iaurt_grecesc: ['lactate'],
  iaurt_grecesc_10: ['lactate'],
  unt_82: ['lactate'],
  mozzarella_rasa: ['lactate'],
  cascaval_clasic: ['lactate'],
  parmezan_ras: ['lactate'],
  crema_branza: ['lactate'],
  branza_feta: ['lactate'],
  ciocolata_menaj: ['lactate'],

  // Eggs
  oua_m: ['oua'],

  // Fish & shellfish
  file_somon_proaspat: ['peste'],
  somon_afumat: ['peste'],
  ton_conserva: ['peste'],
  dorada_proaspata: ['peste'],
  creveti_decorticati: ['crustacee'],

  // Nuts, peanuts, sesame
  nuci_miez: ['nuci'],
  unt_arahide: ['arahide'],
  naut_conserva: ['susan'],

  // Soy & mustard
  sos_soia: ['soia', 'gluten'],
  mustar_clasic: ['mustar'],
};

export function getIngredientAllergens(ingredientId: string): Allergen[] {
  return INGREDIENT_ALLERGENS[ingredientId] ?? [];
}
