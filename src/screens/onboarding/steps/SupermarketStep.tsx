import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SUPERMARKET_LIST } from '../../../data/supermarkets';
import { SupermarketId } from '../../../types';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 6: supermarket */
export function SupermarketStep({
  isLargeScreen,
  preferences,
  setSupermarket,
  theme,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>Alege magazinul tău</Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Calculăm meniul și coșul săptămânal pe prețurile estimate ale magazinului ales.
      </Text>

      <View style={[styles.supermarketGrid, isLargeScreen && styles.supermarketGridDesktop]}>
        {SUPERMARKET_LIST.map((market) => {
          const isSelected = preferences.supermarketId === market.id;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={market.id}
              onPress={() => setSupermarket(market.id as SupermarketId)}
              activeOpacity={0.7}
              style={[
                styles.supermarketCard,
                isLargeScreen && styles.supermarketCardDesktop,
                {
                  backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={[styles.marketBadge, { backgroundColor: market.brandColor }]}>
                <Text style={styles.marketBadgeText}>{market.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.supermarketName, { color: theme.text }]}>{market.name}</Text>
                <Text style={[styles.supermarketTagline, { color: theme.textMuted }]}>
                  {market.tagline}
                </Text>
              </View>
              <View
                style={[
                  styles.supermarketRadio,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                  },
                ]}
              >
                {isSelected && (
                  <Text style={[styles.supermarketRadioCheck, { color: theme.primaryText }]}>
                    ✓
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Step 6 Inter-step Cascade Impact */}
      {(() => {
        const currentMarket =
          SUPERMARKET_LIST.find((m) => m.id === preferences.supermarketId) || SUPERMARKET_LIST[0];
        const totalMeals = preferences.cookingDays.length * preferences.mealSlots.length;
        const totalPortions = totalMeals * preferences.peopleCount;

        return (
          <View
            style={[
              sharedStyles.stepImpactCard,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <View style={sharedStyles.stepImpactHeaderRow}>
              <Text style={sharedStyles.stepImpactIcon}>🛒</Text>
              <View style={{ flex: 1 }}>
                <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
                  Prețuri optimizate la {currentMarket.name}
                </Text>
                <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
                  Ingredientele pentru cele {totalPortions} porții din săptămână vor fi estimate pe
                  prețurile reale la raft din {currentMarket.name}.
                </Text>
              </View>
            </View>
            <View style={sharedStyles.stepImpactPillsRow}>
              <View
                style={[
                  sharedStyles.stepImpactMiniPill,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
                  💡 {currentMarket.tagline}
                </Text>
              </View>
              <View
                style={[
                  sharedStyles.stepImpactMiniPill,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
                  🍿 Gustările din pasul următor se vor adapta la acest magazin
                </Text>
              </View>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  supermarketGrid: {
    gap: 12,
  },
  supermarketGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  supermarketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  supermarketCardDesktop: {
    flex: 1,
    minWidth: 230,
    maxWidth: 290,
  },
  supermarketRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supermarketRadioCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  marketBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketBadgeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  supermarketName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  supermarketTagline: {
    fontSize: 12,
    flex: 1,
  },
});
