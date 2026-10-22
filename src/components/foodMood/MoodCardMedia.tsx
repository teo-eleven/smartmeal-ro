import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ARCHETYPE_BACKDROPS } from '../../../assets/recipes/backdrops';
import { ARCHETYPE_PHOTO_URLS } from '../../utils/recipePhotography';
import { DishArchetype } from '../../utils/recipeVisual';

interface MoodCardMediaProps {
  archetype: DishArchetype;
  isDark: boolean;
}

const PHOTO_FADE_MS = 200;
const SCRIM_DARK = ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', '#1C241E'] as const;
const SCRIM_LIGHT = ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.25)', '#ffffff'] as const;
const EMPTY_DARK = ['#243027', '#1C241E'] as const;
const EMPTY_LIGHT = ['#f4f4f5', '#e4e4e7'] as const;

/**
 * The picture at the top of an onboarding craving card: a photo of that kind of food,
 * falling back to the local blurred backdrop when the photo cannot load (first launch
 * offline), and to a plain gradient when there is no backdrop either.
 */
export const MoodCardMedia: React.FC<MoodCardMediaProps> = ({ archetype, isDark }) => {
  const photoUrl = ARCHETYPE_PHOTO_URLS[archetype];
  const backdrop = ARCHETYPE_BACKDROPS[archetype];
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  if (!showPhoto && !backdrop) {
    return (
      <LinearGradient
        colors={[...(isDark ? EMPTY_DARK : EMPTY_LIGHT)]}
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
          onError={() => setPhotoFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Image
          testID="mood-card-backdrop"
          source={backdrop}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={[...(isDark ? SCRIM_DARK : SCRIM_LIGHT)]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
};
