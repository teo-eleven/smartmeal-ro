import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { LOCAL_RECIPE_IMAGES } from '../../assets/recipes';
import {
  getArchetypePalette,
  getRecipeArchetype,
  getRecipeHighlights,
  getRecipeIcons,
  getTotalMinutes,
} from '../utils/recipeVisual';

interface RecipeVisualProps {
  recipe: Recipe;
  isDark: boolean;
  /** Compact cards drop the ingredient names and keep only the pictograms. */
  compact?: boolean;
  style?: object;
}

/**
 * The picture at the top of a recipe card.
 *
 * A photograph is used only where one of this dish actually exists. Everything else gets a
 * card built from the recipe's own ingredients and timing: stock photography of "a stew"
 * standing in for a specific Romanian dish was, in practice, wrong often enough to be worse
 * than no photograph at all.
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
  const icons = getRecipeIcons(recipe, compact ? 3 : 4);
  const highlights = getRecipeHighlights(recipe, 3);
  const minutes = getTotalMinutes(recipe);

  return (
    <View
      style={[styles.fill, style]}
      accessibilityRole="image"
      accessibilityLabel={`${palette.labelRo}. Ingrediente principale: ${highlights.join(', ')}. ${minutes} minute.`}
    >
      <LinearGradient
        colors={isDark ? palette.darkColors : palette.lightColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.iconRow}>
          {icons.map((icon, index) => (
            <Text key={`${icon}-${index}`} style={compact ? styles.iconCompact : styles.icon}>
              {icon}
            </Text>
          ))}
        </View>

        {!compact && (
          <View style={styles.chipRow}>
            {highlights.map((name) => (
              <View key={name} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.cornerLabel}>
        <Text style={styles.cornerText}>{palette.labelRo}</Text>
      </View>

      <View style={styles.cornerTime}>
        <Text style={styles.cornerText}>⏱ {minutes} min</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 14,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 42,
    lineHeight: 52,
  },
  iconCompact: {
    fontSize: 30,
    lineHeight: 38,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  chip: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: 130,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 10,
    fontWeight: '700',
  },
  cornerLabel: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cornerTime: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cornerText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
