import React from 'react';
import { Image, ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { LOCAL_RECIPE_IMAGES } from '../../assets/recipes';
import { ARCHETYPE_BACKDROPS } from '../../assets/recipes/backdrops';
import {
  getArchetypePalette,
  getRecipeArchetype,
  getRecipeHighlights,
  getTotalMinutes,
} from '../utils/recipeVisual';

interface RecipeVisualProps {
  recipe: Recipe;
  isDark: boolean;
  /** Compact cards drop the ingredient line and shrink the title. */
  compact?: boolean;
  style?: object;
}

/**
 * The picture at the top of a recipe card.
 *
 * A photograph of the dish itself is used wherever one exists. Everything else gets the dish
 * name set over a heavily treated photograph from the same archetype — blurred, desaturated
 * and darkened, so it reads as texture rather than as a portrait of that particular dish.
 * Untreated stock photography was tried and produced a picture of headphones on a bean stew;
 * see ADR-07.
 */
export const RecipeVisual: React.FC<RecipeVisualProps> = ({
  recipe,
  isDark,
  compact = false,
  style,
}) => {
  const localPhoto: ImageSourcePropType | undefined = LOCAL_RECIPE_IMAGES[recipe.id];

  if (localPhoto) {
    return <Image source={localPhoto} style={[styles.fill, style]} resizeMode="cover" />;
  }

  const archetype = getRecipeArchetype(recipe);
  const palette = getArchetypePalette(archetype);
  const highlights = getRecipeHighlights(recipe, 3);
  const minutes = getTotalMinutes(recipe);
  const backdrop = ARCHETYPE_BACKDROPS[archetype];

  const accessibilityLabel = `${recipe.title}. ${palette.labelRo}. Ingrediente principale: ${highlights.join(', ')}. ${minutes} minute.`;

  const content = (
    <View style={styles.content} pointerEvents="none">
      <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 2 : 3}>
        {recipe.title}
      </Text>

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

  const corners = (
    <>
      <View style={styles.cornerLeft}>
        <Text style={styles.cornerText}>{palette.labelRo}</Text>
      </View>
      <View style={styles.cornerRight}>
        <Text style={styles.cornerText}>⏱ {minutes} min</Text>
      </View>
    </>
  );

  // No backdrop exists for this archetype, so the gradient carries the card on its own.
  if (!backdrop) {
    return (
      <View style={[styles.fill, style]} accessibilityLabel={accessibilityLabel}>
        <LinearGradient
          colors={isDark ? palette.darkColors : palette.lightColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {content}
        {corners}
      </View>
    );
  }

  return (
    <ImageBackground
      source={backdrop}
      resizeMode="cover"
      style={[styles.fill, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {/* Tints the backdrop toward the archetype's colour and keeps the title readable. */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(0,0,0,0.30)', `${palette.darkColors[1]}E6`]
            : ['rgba(0,0,0,0.25)', `${palette.darkColors[0]}D9`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {content}
      {corners}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  title: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  rule: {
    width: 46,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginTop: 12,
    marginBottom: 10,
  },
  highlights: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  cornerLeft: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cornerRight: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cornerText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
