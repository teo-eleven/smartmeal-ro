import { useEffect } from 'react';
import { useFonts } from 'expo-font';
// The file itself, not the package index: that one is an ES module listing every weight.
import LibreCaslonText_700Bold from '@expo-google-fonts/libre-caslon-text/700Bold/LibreCaslonText_700Bold.ttf';

/** Only the Bold file ships, as nothing else uses the family. It covers Ă, Â, Î, Ș and Ț. */
export const TITLE_FONT_FILES = { LibreCaslonText_700Bold };

/**
 * True once the title font is ready, or once it has failed: titles then fall back to the
 * system font rather than keep the app waiting.
 */
export function useTitleFont(): boolean {
  const [isLoaded, error] = useFonts(TITLE_FONT_FILES);
  useEffect(() => {
    if (error) console.warn('[SmartMeal] Fontul titlurilor nu s-a încărcat.', error);
  }, [error]);
  return isLoaded || error != null;
}
