import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Recipe } from '../types';
import { getRecipePhoto } from '../utils/recipePhotography';

interface PhotoCreditLineProps {
  recipe: Recipe;
  color: string;
}

/**
 * "Foto: author · licence", linking to the file's page. Wikimedia Commons licences (CC BY,
 * CC BY-SA) require the author and licence to be shown wherever the photo is; the detail view
 * is where the photo is largest, so it carries the credit. Nothing renders without a credit.
 */
export const PhotoCreditLine: React.FC<PhotoCreditLineProps> = ({ recipe, color }) => {
  const credit = getRecipePhoto(recipe)?.credit;
  if (!credit) return null;

  const openSource = () => {
    Linking.openURL(credit.sourceUrl).catch(() => undefined);
  };

  return (
    <TouchableOpacity
      onPress={openSource}
      accessibilityRole="link"
      accessibilityLabel={`Fotografie de ${credit.author}, licență ${credit.license}. Deschide sursa.`}
      accessibilityHint="Deschide pagina fotografiei pe Wikimedia Commons"
      hitSlop={CREDIT_HIT_SLOP}
      style={styles.row}
    >
      {/* Licence first: CC BY needs it visible, and a long author name must not push it off. */}
      <Text style={[styles.text, { color }]} numberOfLines={2}>
        Foto {credit.license} · {credit.author} · Wikimedia Commons
      </Text>
    </TouchableOpacity>
  );
};

/** 44 pt is the minimum comfortable touch target; the text itself is small. */
const MIN_TOUCH_TARGET = 44;
const CREDIT_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  row: { paddingHorizontal: 4, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  text: { fontSize: 11, opacity: 0.8 },
});
