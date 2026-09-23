/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Backdrop per dish archetype, for recipes that have no photograph of their own.
 *
 * Each one is a real photograph of a dish FROM THAT SAME ARCHETYPE, pre-blurred, desaturated
 * and darkened at build time — so it reads as texture behind the dish name rather than as a
 * portrait of the dish. Pre-processing avoids a runtime blur dependency and keeps the files
 * tiny (~13 KB each, since blurred images compress well).
 *
 * `salad` and `wrap` are deliberately absent: the photo library has nothing from those
 * archetypes, and borrowing from another one is exactly the mistake ADR-07 exists to prevent.
 * Those cards fall back to the gradient alone.
 *
 * Regenerate with: scripts/generateBackdrops.ts
 */
import { ImageSourcePropType } from 'react-native';

export const ARCHETYPE_BACKDROPS: Record<string, ImageSourcePropType> = {
  soup: require('./soup.jpg'),
  stew: require('./stew.jpg'),
  pasta: require('./pasta.jpg'),
  grill: require('./grill.jpg'),
  roast: require('./roast.jpg'),
  breakfast: require('./breakfast.jpg'),
  dessert: require('./dessert.jpg'),
  seafood: require('./seafood.jpg'),
  rice: require('./rice.jpg'),
  snack: require('./snack.jpg'),
};
