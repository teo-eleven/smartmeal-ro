import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ARCHETYPE_BACKDROPS } from '../../../assets/recipes/backdrops';
import { ARCHETYPE_PHOTO_URLS } from '../../utils/recipePhotography';
import { DishArchetype } from '../../utils/recipeVisual';
import { getAppTheme } from '../../styles/theme';

interface MoodCardMediaProps {
  archetype: DishArchetype;
  isDark: boolean;
}

const PHOTO_FADE_MS = 200;

/**
 * The picture at the top of an onboarding craving card: a photo of that kind of food,
 * falling back to the local blurred backdrop when the photo cannot load (first launch
 * offline), and to a plain gradient when there is no backdrop either.
 */
export const MoodCardMedia: React.FC<MoodCardMediaProps> = ({ archetype, isDark }) => {
  // The photo fades into the card it sits on.
  const theme = getAppTheme(isDark);
  const photoUrl = ARCHETYPE_PHOTO_URLS[archetype];
  const backdrop = ARCHETYPE_BACKDROPS[archetype];
  // The failed URL, not a flag: if the same card is reused for another archetype, its photo
  // gets its own chance instead of inheriting the previous failure.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl) && photoUrl !== failedUrl;

  if (!showPhoto && !backdrop) {
    return (
      <LinearGradient
        colors={[theme.surfaceSecondary, theme.card]}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <>
      {showPhoto ? (
        <Image
          testID="mood-card-photo"
          source={{ uri: photoUrl }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={PHOTO_FADE_MS}
          onError={() => setFailedUrl(photoUrl)}
          style={StyleSheet.absoluteFill}
          accessible={false}
          accessibilityLabel=""
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Image
          testID="mood-card-backdrop"
          source={backdrop}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
          accessibilityLabel=""
        />
      )}
      <LinearGradient
        colors={['transparent', theme.photoScrim, theme.card]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
};
