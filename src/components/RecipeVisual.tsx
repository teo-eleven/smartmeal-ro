import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { ARCHETYPE_BACKDROPS } from '../../assets/recipes/backdrops';
import {
  getArchetypePalette,
  getRecipeArchetype,
  getRecipeHighlights,
  getTotalMinutes,
} from '../utils/recipeVisual';
import { getRecipePhotographyUri } from '../utils/recipePhotography';

interface RecipeVisualProps {
  recipe: Recipe;
  isDark: boolean;
  /** Compact cards drop the ingredient line and shrink the title. */
  compact?: boolean;
  style?: object;
}

/**
 * The visual presentation of a recipe card.
 * Displays high-definition, appetizing food photography with a clear, subtle scrim
 * and crisp typography so dishes are vibrant, mouth-watering, and easy to read.
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
  const photoUri = recipe.imageUrl || getRecipePhotographyUri(recipe, archetype);

  const accessibilityLabel = `${recipe.title}. ${palette.labelRo}. Ingrediente principale: ${highlights.join(', ')}. ${minutes} minute.`;

  const content = (
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
  );

  const imageSource = photoUri ? { uri: photoUri } : backdrop;

  if (!imageSource) {
    return (
      <View style={[styles.fill, style]} accessibilityLabel={accessibilityLabel}>
        <LinearGradient
          colors={isDark ? palette.darkColors : palette.lightColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {content}
      </View>
    );
  }

  return (
    <ImageBackground
      source={imageSource}
      resizeMode="cover"
      style={[styles.fill, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Subtle appetizing scrim: keeps food visible, vibrant and mouthwatering */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.22)', 'rgba(19, 25, 20, 0.58)']
            : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.15)', 'rgba(30, 38, 32, 0.48)']
        }
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {content}
    </ImageBackground>
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
