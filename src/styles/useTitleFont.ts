import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
// The file itself, not the package index: that one is an ES module listing every weight.
import LibreCaslonText_700Bold from '@expo-google-fonts/libre-caslon-text/700Bold/LibreCaslonText_700Bold.ttf';

/** Only the Bold file ships, as nothing else uses the family. It covers Ă, Â, Î, Ș and Ț. */
export const TITLE_FONT_FILES = { LibreCaslonText_700Bold };

/** A font that neither loads nor fails by then (a stalled request) stops holding the app. */
export const TITLE_FONT_TIMEOUT_MS = 3000;

/**
 * True once the title font is ready, once it has failed, or after TITLE_FONT_TIMEOUT_MS:
 * titles then fall back to the system font rather than keep the app waiting.
 */
export function useTitleFont(): boolean {
  const [isLoaded, error] = useFonts(TITLE_FONT_FILES);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (error) console.warn('[SmartMeal] Fontul titlurilor nu s-a încărcat.', error);
  }, [error]);

  useEffect(() => {
    if (isLoaded || error) return undefined;
    const timer = setTimeout(() => {
      console.warn('[SmartMeal] Fontul titlurilor întârzie; pornim cu fontul sistemului.');
      setHasTimedOut(true);
    }, TITLE_FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded, error]);

  return isLoaded || error != null || hasTimedOut;
}
