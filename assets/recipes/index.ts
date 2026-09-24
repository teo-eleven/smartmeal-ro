/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Local Recipe Image Asset Registry
 * Maps recipe IDs to local generated photo assets.
 *
 * The key must be a recipe id from `src/data/recipes.ts`; the file name need not match it.
 * Three entries were keyed by the file name instead, so three recipes that owned a real
 * photograph fell through to a shared archetype backdrop while their picture sat unused.
 * `recipeImagery.test.ts` fails if a key stops matching a real recipe.
 */

import { ImageSourcePropType } from 'react-native';

export const LOCAL_RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
  pui_airfryer_cartofi: require('./pui_airfryer_cartofi.jpg'),
  omleta_cremoasa_spanac_branza: require('./omleta_cremoasa_spanac_branza.jpg'),
  terci_ovaz_fructe_miere: require('./terci_ovaz_fructe_miere.jpg'),
  popcorn_aromat_parmezan_boia: require('./popcorn_aromat_parmezan_boia.jpg'),
  lava_cake_ciocolata_airfryer: require('./lava_cake_ciocolata_airfryer.jpg'),
  bulz_ciobanesc_cuptor: require('./bulz_ciobanesc_cuptor.jpg'),
  cartofi_la_cuptor_telemea: require('./cartofi_gratinati_cuptor.jpg'),
  chiftelute_marinate_sos: require('./chiftelute_marinate_sos.jpg'),
  ciorba_radauteana_rapida: require('./ciorba_radauteana_rapida.jpg'),
  mamaliga_branza_smantana: require('./mamaliga_branza_smantana.jpg'),
  tocanita_cartofi_carnaciori: require('./mancare_cartofi_carnaciori.jpg'),
  muschiulet_porc_cuptor: require('./muschiulet_porc_cuptor.jpg'),
  paste_bolognese_clasice: require('./paste_bolognese_clasice.jpg'),
  paste_carbonara_rapide: require('./paste_carbonara_rapide.jpg'),
  paste_cremoase_spanac: require('./penne_cremoase_spanac_parmezan.jpg'),
  snitele_pui_cuptor: require('./snitele_pui_cuptor.jpg'),
  somon_la_tigaie_orez: require('./somon_la_tigaie_orez.jpg'),
  tocanita_ciuperci_mamaliga: require('./tocanita_ciuperci_mamaliga.jpg'),
};
