import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { SUPERMARKET_LIST } from '../data/supermarkets';
import { getRetailProductsByCategory } from '../data/retailProducts';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';

interface SnacksAndDrinksModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const SnacksAndDrinksModal: React.FC<SnacksAndDrinksModalProps> = ({
  visible,
  onClose,
  isDark,
}) => {
  const { preferences, toggleSnackProduct, toggleDrinkProduct, setIncludeAlcohol } = useAppStore();
  const { contentMaxWidth, isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  const supermarket = SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId);

  const selectedSnacks = preferences.selectedSnackIds || [];
  const selectedDrinks = preferences.selectedDrinkIds || [];
  const totalCount = selectedSnacks.length + selectedDrinks.length;

  const appTheme = getAppTheme(isDark);
  const theme = {
    ...appTheme,
    overlay: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)',
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: theme.overlay },
          isLargeScreen && styles.modalOverlayDesktop,
        ]}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
            isLargeScreen && [styles.modalContainerDesktop, { maxWidth: Math.min(contentMaxWidth, 1200) }],
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                🍿 Ronțăieli & 🥤 Băuturi
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                Oferta curentă {supermarket?.name || 'Supermarket'}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Închide" onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Supermarket Flyer Badge */}
            <View
              style={[
                styles.supermarketBadge,
                { backgroundColor: theme.btnBg, borderColor: theme.border },
              ]}
            >
              <Text style={styles.badgeIcon}>🏷️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.badgeTitle, { color: theme.primary }]}>
                  Prețuri din revista oficială {supermarket?.name}
                </Text>
                <Text style={[styles.badgeDesc, { color: theme.textMuted }]}>
                  Produsele adăugate apar direct în lista ta de cumpărături cu ambalajul exact.
                </Text>
              </View>
            </View>

            {/* SECTION 1: RONȚĂIELI SĂRATE */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              🍿 Chipsuri & Snacks Sărate
            </Text>
            <View style={[styles.productsGrid, isLargeScreen && styles.productsGridDesktop]}>
              {getRetailProductsByCategory('snack_savory').map((prod) => {
                const isSelected = selectedSnacks.includes(prod.id);
                const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={prod.id}
                    onPress={() => toggleSnackProduct(prod.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.productCard,
                      isLargeScreen && styles.productCardDesktop,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.productIcon}>{prod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: isSelected ? theme.primary : theme.text }]}>
                        {prod.name}
                      </Text>
                      <Text style={[styles.productDetails, { color: theme.textMuted }]}>
                        {prod.brand} • {prod.packageSize}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.productPrice, { color: isSelected ? theme.primary : theme.text }]}>
                        {price.toFixed(2)} lei
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && <Text style={[styles.checkIcon, { color: theme.primaryText }]}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION 2: DULCIURI & CIOCOLATĂ */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
              🍫 Ciocolată & Dulciuri
            </Text>
            <View style={[styles.productsGrid, isLargeScreen && styles.productsGridDesktop]}>
              {getRetailProductsByCategory('snack_sweet').map((prod) => {
                const isSelected = selectedSnacks.includes(prod.id);
                const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={prod.id}
                    onPress={() => toggleSnackProduct(prod.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.productCard,
                      isLargeScreen && styles.productCardDesktop,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.productIcon}>{prod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: isSelected ? theme.primary : theme.text }]}>
                        {prod.name}
                      </Text>
                      <Text style={[styles.productDetails, { color: theme.textMuted }]}>
                        {prod.brand} • {prod.packageSize}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.productPrice, { color: isSelected ? theme.primary : theme.text }]}>
                        {price.toFixed(2)} lei
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && <Text style={[styles.checkIcon, { color: theme.primaryText }]}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION 3: BĂUTURI RĂCORITOARE & APĂ */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
              🥤 Băuturi Răcoritoare & Apă
            </Text>
            <View style={[styles.productsGrid, isLargeScreen && styles.productsGridDesktop]}>
              {getRetailProductsByCategory('drink_soft').map((prod) => {
                const isSelected = selectedDrinks.includes(prod.id);
                const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={prod.id}
                    onPress={() => toggleDrinkProduct(prod.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.productCard,
                      isLargeScreen && styles.productCardDesktop,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.productIcon}>{prod.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: isSelected ? theme.primary : theme.text }]}>
                        {prod.name}
                      </Text>
                      <Text style={[styles.productDetails, { color: theme.textMuted }]}>
                        {prod.brand} • {prod.packageSize}
                      </Text>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.productPrice, { color: isSelected ? theme.primary : theme.text }]}>
                        {price.toFixed(2)} lei
                      </Text>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && <Text style={[styles.checkIcon, { color: theme.primaryText }]}>✓</Text>}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION 4: BĂUTURI ALCOOLICE (18+) */}
            <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
              🍺 Băuturi Alcoolice (Bere, Vin, Spumant)
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setIncludeAlcohol(!preferences.includeAlcohol)}
              activeOpacity={0.7}
              style={[
                styles.alcoholBanner,
                {
                  backgroundColor: preferences.includeAlcohol
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.16)'
                      : '#fef2f2'
                    : theme.accentBg,
                  borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
                },
              ]}
            >
              <Text style={styles.badgeIcon}>🔞</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.badgeTitle,
                    { color: preferences.includeAlcohol ? '#ef4444' : theme.text },
                  ]}
                >
                  Băuturi alcoolice permise (18+)
                </Text>
                <Text style={[styles.badgeDesc, { color: theme.textMuted }]}>
                  {preferences.includeAlcohol
                    ? 'Secțiunea este activă. Alege beri, vinuri românești sau spumante.'
                    : 'Apasă pentru a afișa opțiunile de bere, vin sau cidru.'}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: preferences.includeAlcohol ? '#ef4444' : 'transparent',
                    borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
                  },
                ]}
              >
                {preferences.includeAlcohol && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </TouchableOpacity>

            {preferences.includeAlcohol && (
              <View style={[styles.productsGrid, isLargeScreen && styles.productsGridDesktop, { marginTop: 10 }]}>
                {getRetailProductsByCategory('drink_alcoholic').map((prod) => {
                  const isSelected = selectedDrinks.includes(prod.id);
                  const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={prod.id}
                      onPress={() => toggleDrinkProduct(prod.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.productCard,
                        isLargeScreen && styles.productCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.productIcon}>{prod.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: isSelected ? theme.primary : theme.text }]}>
                          {prod.name}
                        </Text>
                        <Text style={[styles.productDetails, { color: theme.textMuted }]}>
                          {prod.brand} • {prod.packageSize}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={[styles.productPrice, { color: isSelected ? theme.primary : theme.text }]}>
                          {price.toFixed(2)} lei
                        </Text>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          {isSelected && <Text style={[styles.checkIcon, { color: theme.primaryText }]}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Text style={[styles.footerStatus, { color: theme.textMuted }]}>
              {totalCount === 0
                ? 'Nicio gustare selectată'
                : `${totalCount} ${totalCount === 1 ? 'produs adăugat' : 'produse adăugate'} în lista de cumpărături`}
            </Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Închide" onPress={onClose} style={[styles.doneBtn, { backgroundColor: theme.primary }]}>
              <Text style={[styles.doneBtnText, { color: theme.primaryText }]}>Gata ({totalCount})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 20,
  },
  modalContainerDesktop: {
    width: '92%',
    borderRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  supermarketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 16,
  },
  alcoholBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  productsGrid: {
    gap: 8,
  },
  productsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  productCardDesktop: {
    flexGrow: 1,
    flexShrink: 0,
    width: '31.5%',
    minWidth: 280,
    maxWidth: 360,
  },
  productIcon: {
    fontSize: 24,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
  },
  productDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
