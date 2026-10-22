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
      style={styles.row}
    >
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        Foto: {credit.author} · {credit.license} · Wikimedia Commons
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: { paddingHorizontal: 4, paddingTop: 6, minHeight: 24 },
  text: { fontSize: 11, opacity: 0.8 },
});
