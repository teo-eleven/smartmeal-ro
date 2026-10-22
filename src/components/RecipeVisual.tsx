import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { ARCHETYPE_BACKDROPS } from '../../assets/recipes/backdrops';
import {
  getArchetypePalette,
  getRecipeArchetype,
  getRecipeHighlights,
  getTotalMinutes,
} from '../utils/recipeVisual';
import { getRecipePhoto } from '../utils/recipePhotography';

interface RecipeVisualProps {
  recipe: Recipe;
  isDark: boolean;
  /** Compact cards drop the ingredient line and shrink the title. */
  compact?: boolean;
  style?: object;
}

/** Fade-in for a photo arriving from the network, so it does not pop over the card. */
const PHOTO_FADE_MS = 200;

const PHOTO_SCRIM_DARK = [
  'rgba(0,0,0,0.03)',
  'rgba(0,0,0,0.22)',
  'rgba(19, 25, 20, 0.58)',
] as const;
const PHOTO_SCRIM_LIGHT = [
  'rgba(0,0,0,0.02)',
  'rgba(0,0,0,0.15)',
  'rgba(30, 38, 32, 0.48)',
] as const;
const CARD_SCRIM_DARK = ['rgba(0,0,0,0.10)', 'rgba(19, 25, 20, 0.75)'] as const;
const CARD_SCRIM_LIGHT = ['rgba(0,0,0,0.05)', 'rgba(30, 38, 32, 0.65)'] as const;

/**
 * The picture at the top of a recipe card.
 *
 * A verified photograph of this dish when the manifest has one (ADR-20). Otherwise, or when
 * that photo fails to load (offline, removed upstream), the card generated from the recipe:
 * its name over its archetype's blurred backdrop, or over the archetype gradient (ADR-07).
 * The container always has a background, so a slow or failed photo never leaves a blank box.
 */
export const RecipeVisual: React.FC<RecipeVisualProps> = ({
  recipe,
  isDark,
  compact = false,
  style,
}) => {
  const archetype = getRecipeArchetype(recipe);
  const palette = getArchetypePalette(archetype);
  const highlights = getRecipeHighlights(recipe, 3);
  const minutes = getTotalMinutes(recipe);
  const backdrop = ARCHETYPE_BACKDROPS[archetype];
  const photo = getRecipePhoto(recipe);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = photo !== null && photo.url !== failedUrl;

  const accessibilityLabel = `${recipe.title}. ${palette.labelRo}. Ingrediente principale: ${highlights.join(', ')}. ${minutes} minute.`;
  const colors = isDark ? palette.darkColors : palette.lightColors;

  return (
    <View
      style={[styles.fill, { backgroundColor: colors[1] }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {showPhoto ? (
        <Image
          testID="recipe-photo"
          source={{ uri: photo.url }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={PHOTO_FADE_MS}
          onError={() => setFailedUrl(photo.url)}
          style={StyleSheet.absoluteFill}
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      ) : backdrop ? (
        <Image
          source={backdrop}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={
          showPhoto
            ? [...(isDark ? PHOTO_SCRIM_DARK : PHOTO_SCRIM_LIGHT)]
            : [...(isDark ? CARD_SCRIM_DARK : CARD_SCRIM_LIGHT)]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* No corner badges here: every screen that shows this picture lays its own over it. */}
      <View style={styles.content} pointerEvents="none">
        <View style={styles.titleContainer}>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>

        {!compact && (
          <>
            <View style={styles.rule} />
            <Text style={styles.highlights} numberOfLines={1}>
              {highlights.join(' · ').toUpperCase()}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  title: {
    width: '100%',
    maxWidth: '100%',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 23,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 8,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  rule: {
    width: 46,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginTop: 10,
    marginBottom: 8,
  },
  highlights: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.80)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
