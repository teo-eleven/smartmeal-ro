/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Local Recipe Image Asset Registry
 * Maps recipe IDs to local generated photo assets
 */

import { ImageSourcePropType } from 'react-native';

export const LOCAL_RECIPE_IMAGES: Record<string, ImageSourcePropType> = {
  pui_airfryer_cartofi: require('./pui_airfryer_cartofi.jpg'),
  omleta_cremoasa_spanac_branza: require('./omleta_cremoasa_spanac_branza.jpg'),
  terci_ovaz_fructe_miere: require('./terci_ovaz_fructe_miere.jpg'),
  popcorn_aromat_parmezan_boia: require('./popcorn_aromat_parmezan_boia.jpg'),
  lava_cake_ciocolata_airfryer: require('./lava_cake_ciocolata_airfryer.jpg'),
};
