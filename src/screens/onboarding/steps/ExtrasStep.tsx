import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRetailProductsByCategory } from '../../../data/retailProducts';
import { SUPERMARKET_LIST } from '../../../data/supermarkets';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 7: retail snacks & beverages */
export function ExtrasStep({
  extrasCost,
  isDark,
  isLargeScreen,
  preferences,
  setIncludeAlcohol,
  setSnackTastePreference,
  theme,
  toggleDrinkProduct,
  toggleSnackProduct,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        🍿 Ronțăieli & 🥤 Băuturi de Magazin
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Alege gustările pentru meci/film și băuturile preferate, cu prețuri estimate la magazinul
        ales.
      </Text>

      {/* Supermarket Banner */}
      <View
        style={[
          styles.retailSupermarketBanner,
          { backgroundColor: theme.primaryLight, borderColor: theme.primary },
        ]}
      >
        <Text style={styles.retailBannerIcon}>🛒</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.retailBannerTitle, { color: theme.primary }]}>
            Produse la{' '}
            {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name ||
              'magazinul ales'}
          </Text>
          <Text style={[styles.retailBannerSubtitle, { color: theme.textMuted }]}>
            Prețuri estimate după prețurile obișnuite la raft. La casă pot diferi.
          </Text>
        </View>
      </View>

      {/* SNACK TASTE SELECTOR [Dulce] vs [Sărat] vs [Ambele] */}
      <View
        style={[
          styles.snackTasteBox,
          { backgroundColor: theme.accentBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.snackTasteTitle, { color: theme.text }]}>
          Ce fel de gustări preferi de obicei?
        </Text>
        <View style={styles.snackTasteSegmentedRow}>
          {[
            { id: 'savory', label: '🍿 Gustări Sărate', desc: 'Chipsuri, pufuleți & alune' },
            { id: 'sweet', label: '🍫 Gustări Dulci', desc: 'Ciocolată, biscuiți & napolitane' },
          ].map((tab) => {
            const activeTaste = preferences.snackTastePreference === 'sweet' ? 'sweet' : 'savory';
            const isCurrent = activeTaste === tab.id;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                key={tab.id}
                onPress={() => setSnackTastePreference(tab.id as 'sweet' | 'savory')}
                style={[
                  styles.snackTasteTab,
                  {
                    backgroundColor: isCurrent ? theme.primaryLight : 'transparent',
                    borderColor: isCurrent ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.snackTasteTabLabel,
                    {
                      color: isCurrent ? theme.primary : theme.text,
                      fontWeight: isCurrent ? '800' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                <Text style={[styles.snackTasteTabDesc, { color: theme.textMuted }]}>
                  {tab.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* RETAIL SNACKS: DYNAMIC ORDER BASED ON PREFERENCE */}
      {(() => {
        const savorySection = (
          <View key="savory-block" style={{ marginTop: 12 }}>
            <Text style={[styles.retailSectionHeading, { color: theme.text }]}>
              🍿 Chipsuri & Snacks sărate
            </Text>
            <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
              {getRetailProductsByCategory('snack_savory').map((prod) => {
                const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                return (
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    key={prod.id}
                    onPress={() => toggleSnackProduct(prod.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.retailProductCard,
                      isLargeScreen && styles.retailProductCardDesktop,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.retailProductTitle,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {prod.name}
                      </Text>
                      <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                        {prod.brand} • {prod.packageSize}
                      </Text>
                    </View>
                    <View style={styles.retailPriceBox}>
                      <Text
                        style={[
                          styles.retailProductPrice,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {price.toFixed(2)} lei
                      </Text>
                      <View
                        style={[
                          styles.retailCheckbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

        const sweetSection = (
          <View key="sweet-block" style={{ marginTop: 16 }}>
            <Text style={[styles.retailSectionHeading, { color: theme.text }]}>
              🍫 Ciocolată & Dulciuri
            </Text>
            <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
              {getRetailProductsByCategory('snack_sweet').map((prod) => {
                const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                return (
                  <TouchableOpacity
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    key={prod.id}
                    onPress={() => toggleSnackProduct(prod.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.retailProductCard,
                      isLargeScreen && styles.retailProductCardDesktop,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.retailProductTitle,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {prod.name}
                      </Text>
                      <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                        {prod.brand} • {prod.packageSize}
                      </Text>
                    </View>
                    <View style={styles.retailPriceBox}>
                      <Text
                        style={[
                          styles.retailProductPrice,
                          { color: isSelected ? theme.primary : theme.text },
                        ]}
                      >
                        {price.toFixed(2)} lei
                      </Text>
                      <View
                        style={[
                          styles.retailCheckbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

        const activeTaste = preferences.snackTastePreference === 'sweet' ? 'sweet' : 'savory';
        return activeTaste === 'sweet' ? [sweetSection] : [savorySection];
      })()}

      {/* SECTION 3: BĂUTURI RĂCORITOARE & APĂ */}
      <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
        🥤 Băuturi Răcoritoare & Apă
      </Text>
      <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
        {getRetailProductsByCategory('drink_soft').map((prod) => {
          const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
          const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
          return (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              key={prod.id}
              onPress={() => toggleDrinkProduct(prod.id)}
              activeOpacity={0.7}
              style={[
                styles.retailProductCard,
                isLargeScreen && styles.retailProductCardDesktop,
                {
                  backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={styles.retailProductIcon}>{prod.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.retailProductTitle,
                    { color: isSelected ? theme.primary : theme.text },
                  ]}
                >
                  {prod.name}
                </Text>
                <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                  {prod.brand} • {prod.packageSize}
                </Text>
              </View>
              <View style={styles.retailPriceBox}>
                <Text
                  style={[
                    styles.retailProductPrice,
                    { color: isSelected ? theme.primary : theme.text },
                  ]}
                >
                  {price.toFixed(2)} lei
                </Text>
                <View
                  style={[
                    styles.retailCheckbox,
                    {
                      backgroundColor: isSelected ? theme.primary : 'transparent',
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>✓</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SECTION 4: BĂUTURI ALCOOLICE (18+) */}
      <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
        🍺 Băuturi Alcoolice (Bere, Vin, Spumant)
      </Text>

      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityLabel="Activează secțiunea de băuturi alcoolice (18+)"
        accessibilityState={{ checked: Boolean(preferences.includeAlcohol) }}
        onPress={() => setIncludeAlcohol(!preferences.includeAlcohol)}
        activeOpacity={0.7}
        style={[
          styles.alcoholToggleBox,
          {
            backgroundColor: preferences.includeAlcohol
              ? isDark
                ? 'rgba(239, 68, 68, 0.15)'
                : '#fef2f2'
              : theme.accentBg,
            borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
          },
        ]}
      >
        <Text style={styles.retailBannerIcon}>🔞</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.retailBannerTitle,
              { color: preferences.includeAlcohol ? '#ef4444' : theme.text },
            ]}
          >
            Activează secțiunea de băuturi alcoolice (18+)
          </Text>
          <Text style={[styles.retailBannerSubtitle, { color: theme.textMuted }]}>
            Beri reci, vinuri nobile românești și cidru pentru relaxare.
          </Text>
        </View>
        <View
          style={[
            styles.retailCheckbox,
            {
              backgroundColor: preferences.includeAlcohol ? '#ef4444' : 'transparent',
              borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
            },
          ]}
        >
          {preferences.includeAlcohol && (
            <Text style={[styles.retailCheckmark, { color: '#ffffff' }]}>✓</Text>
          )}
        </View>
      </TouchableOpacity>

      {preferences.includeAlcohol && (
        <View
          style={[
            styles.retailCardsGrid,
            isLargeScreen && styles.retailCardsGridDesktop,
            { marginTop: 10 },
          ]}
        >
          {getRetailProductsByCategory('drink_alcoholic').map((prod) => {
            const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
            const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
            return (
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                key={prod.id}
                onPress={() => toggleDrinkProduct(prod.id)}
                activeOpacity={0.7}
                style={[
                  styles.retailProductCard,
                  isLargeScreen && styles.retailProductCardDesktop,
                  {
                    backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.retailProductTitle,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {prod.name}
                  </Text>
                  <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                    {prod.brand} • {prod.packageSize}
                  </Text>
                </View>
                <View style={styles.retailPriceBox}>
                  <Text
                    style={[
                      styles.retailProductPrice,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {price.toFixed(2)} lei
                  </Text>
                  <View
                    style={[
                      styles.retailCheckbox,
                      {
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Step 7 Inter-step Cascade Impact */}
      {(() => {
        const snacksCount = preferences.selectedSnackIds?.length || 0;
        const drinksCount = preferences.selectedDrinkIds?.length || 0;
        const totalExtras = snacksCount + drinksCount;
        const currentMarket =
          SUPERMARKET_LIST.find((m) => m.id === preferences.supermarketId) || SUPERMARKET_LIST[0];

        return (
          <View
            style={[
              sharedStyles.stepImpactCard,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <View style={sharedStyles.stepImpactHeaderRow}>
              <Text style={sharedStyles.stepImpactIcon}>🍿</Text>
              <View style={{ flex: 1 }}>
                <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
                  {totalExtras > 0
                    ? `${totalExtras} gustări & băuturi adăugate (+${extrasCost.toFixed(2)} lei)`
                    : 'Fără gustări sau băuturi extra adăugate'}
                </Text>
                <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
                  {totalExtras > 0
                    ? `Prețuri estimate la ${currentMarket.name}. Sunt incluse în bugetul de la Pasul 8 și direct în lista de cumpărături.`
                    : 'Poți alege gustări sau băuturi pentru seri de film/meci sau poți continua doar cu mesele principale.'}
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
  retailCardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  retailProductCardDesktop: {
    flexGrow: 0,
    flexShrink: 0,
    width: '31.8%',
    minWidth: 280,
    maxWidth: 380,
  },
  retailSupermarketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 16,
  },
  retailBannerIcon: {
    fontSize: 24,
  },
  retailBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  retailBannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  retailSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  retailCardsGrid: {
    gap: 8,
  },
  retailProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  retailProductIcon: {
    fontSize: 20,
  },
  retailProductTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  retailProductBrand: {
    fontSize: 11,
    marginTop: 1,
  },
  retailPriceBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  retailProductPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  retailCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retailCheckmark: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  alcoholToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 10,
  },
  snackTasteBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  snackTasteTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  snackTasteSegmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snackTasteTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackTasteTabLabel: {
    fontSize: 13,
  },
  snackTasteTabDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
