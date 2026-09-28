import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Allergen } from '../types';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { getAppTheme } from '../styles/theme';

interface AllergenSelectorProps {
  avoidedAllergens: Allergen[];
  onToggleAllergen: (allergen: Allergen) => void;
  isDark: boolean;
}

export const AllergenSelector: React.FC<AllergenSelectorProps> = ({
  avoidedAllergens,
  onToggleAllergen,
  isDark,
}) => {
  const theme = getAppTheme(isDark);

  return (
    <View>
      <View style={styles.grid}>
        {ALLERGEN_CATALOG.map((allergen) => {
          const isAvoided = avoidedAllergens.includes(allergen.id);

          return (
            <TouchableOpacity
              key={allergen.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAvoided }}
              accessibilityLabel={`Evită ${allergen.label}. ${allergen.description}`}
              onPress={() => onToggleAllergen(allergen.id)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isAvoided ? '#ef4444' : theme.btnBg,
                  borderColor: isAvoided ? '#ef4444' : theme.border,
                },
              ]}
            >
              <Text style={styles.icon}>{allergen.icon}</Text>
              <View style={styles.labelGroup}>
                <Text
                  style={[styles.label, { color: isAvoided ? '#ffffff' : theme.text }]}
                  numberOfLines={1}
                >
                  {allergen.label}
                </Text>
                <Text
                  style={[
                    styles.description,
                    { color: isAvoided ? 'rgba(255,255,255,0.85)' : theme.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {allergen.description}
                </Text>
              </View>
              {isAvoided && <Text style={styles.cross}>✕</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* The filter reads our recipe catalogue, not the pack in the shop. Recipes change
          between brands and "may contain" traces are never in a recipe, so the filter can
          narrow the risk but not remove it. */}
      <Text
        accessibilityRole="text"
        accessibilityLabel={ALLERGEN_WARNING}
        style={[styles.warning, { color: theme.textMuted, borderColor: theme.border }]}
      >
        ⚠️ {ALLERGEN_WARNING}
      </Text>
    </View>
  );
};

const ALLERGEN_WARNING =
  'Verifică întotdeauna eticheta produsului. Filtrul exclude rețetele după ingredientele lor, ' +
  'dar rețetele diferă între mărci și urmele („poate conține") nu apar în ele. ' +
  'Nu înlocuiește sfatul medicului.';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 160,
    flexGrow: 1,
    flexBasis: '46%',
  },
  icon: {
    fontSize: 18,
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
  },
  description: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  cross: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  warning: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
});
