import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { INGREDIENTS } from '../data/ingredients';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';

interface PantryInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

// Common staples frequently present in Romanian home pantries and fridges
const PANTRY_STAPLES_LIST = [
  { id: 'ulei_floarea_soarelui', name: 'Ulei de floarea-soarelui', icon: '🌻', cat: 'Cămară' },
  { id: 'ulei_masline_extra', name: 'Ulei de măsline extravirgin', icon: '🫒', cat: 'Cămară' },
  { id: 'ceapa_galbena', name: 'Ceapă galbenă', icon: '🧅', cat: 'Legume' },
  { id: 'usturoi_capatana', name: 'Usturoi', icon: '🧄', cat: 'Legume' },
  { id: 'cartofi_albi', name: 'Cartofi', icon: '🥔', cat: 'Legume' },
  { id: 'orez_bob_rotund', name: 'Orez', icon: '🍚', cat: 'Cămară' },
  { id: 'paste_spaghetti', name: 'Paste spaghetti', icon: '🍝', cat: 'Cămară' },
  { id: 'faina_alba_000', name: 'Făină albă', icon: '🌾', cat: 'Cămară' },
  { id: 'malai_superior', name: 'Mălai', icon: '🌽', cat: 'Cămară' },
  { id: 'sare_fina', name: 'Sare de masă', icon: '🧂', cat: 'Condimente' },
  { id: 'piper_negru_macinat', name: 'Piper negru măcinat', icon: '🌶️', cat: 'Condimente' },
  { id: 'boia_dulce', name: 'Boia dulce', icon: '🌶️', cat: 'Condimente' },
  { id: 'oregano_uscat', name: 'Oregano / Cimbru', icon: '🌿', cat: 'Condimente' },
  { id: 'otet_alb', name: 'Oțet / Suc de lămâie', icon: '🍋', cat: 'Cămară' },
  { id: 'oua_marimea_m', name: 'Ouă de găină', icon: '🥚', cat: 'Lactate' },
  { id: 'unt_65_grasime', name: 'Unt', icon: '🧈', cat: 'Lactate' },
  { id: 'lapte_15', name: 'Lapte 1.5%', icon: '🥛', cat: 'Lactate' },
  { id: 'suc_rosii_passata', name: 'Pastă / Suc de roșii', icon: '🥫', cat: 'Conserve' },
  { id: 'mustar_clasic', name: 'Muștar clasic', icon: '🌭', cat: 'Sosuri' },
];

export const PantryInventoryModal: React.FC<PantryInventoryModalProps> = ({
  visible,
  onClose,
  isDark,
}) => {
  const { preferences, setPantryInventory, currentPlan } = useAppStore();
  const currentPantry: string[] = preferences.pantryInventory || [];
  const { contentMaxWidth } = useResponsive();

  const togglePantryItem = (id: string) => {
    if (currentPantry.includes(id)) {
      setPantryInventory(currentPantry.filter((item: string) => item !== id));
    } else {
      setPantryInventory([...currentPantry, id]);
    }
  };

  const selectAllCommon = () => {
    setPantryInventory(PANTRY_STAPLES_LIST.map((s) => s.id));
  };

  const clearPantry = () => {
    setPantryInventory([]);
  };

  const theme = getAppTheme(isDark);

  const totalSavedEstimate = currentPantry.reduce((acc: number, id: string) => {
    const ing = INGREDIENTS[id];
    return acc + (ing?.typicalPriceRon[preferences.supermarketId] ?? 6);
  }, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.text }]}>🏠 Ce am deja în Cămară & Frigider</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Bifează ingredientele pe care le ai deja acasă pentru a nu le mai cumpăra din magazin.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Închide"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.contentCard, { maxWidth: contentMaxWidth }]}>
            {/* Savings Luminous Card */}
            <View
              style={[
                styles.savingsBanner,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
                  borderColor: theme.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.savingsTitle, { color: theme.text }]}>
                  {currentPantry.length === 0
                    ? 'Nu ai bifat ingrediente din cămară'
                    : `Ai bifat ${currentPantry.length} ingrediente pe care le ai deja acasă`}
                </Text>
                <Text style={[styles.savingsSub, { color: theme.textMuted }]}>
                  Aceste produse nu vor fi adăugate pe nota de plată de la magazin.
                </Text>
              </View>

              {totalSavedEstimate > 0 && (
                <View style={[styles.savingsBadge, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.savingsBadgeLabel, { color: theme.primaryText }]}>Economie estimată</Text>
                  <Text style={[styles.savingsBadgeVal, { color: theme.primaryText }]}>~{Math.round(totalSavedEstimate)} LEI</Text>
                </View>
              )}
            </View>

            {/* Quick Bulk Actions */}
            <View style={styles.bulkRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={selectAllCommon}
                style={[styles.bulkBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.bulkBtnText, { color: theme.primary }]}>✓ Am cămara plină (Bifează tot)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={clearPantry}
                style={[styles.bulkBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.bulkBtnText, { color: theme.textMuted }]}>Deselectează tot</Text>
              </TouchableOpacity>
            </View>

            {/* Grid of Pantry Staples */}
            <View style={styles.staplesGrid}>
              {PANTRY_STAPLES_LIST.map((item) => {
                const isSelected = currentPantry.includes(item.id);
                const dbIng = INGREDIENTS[item.id];
                const price = currentPlan && dbIng ? dbIng.typicalPriceRon[currentPlan.supermarketId] : null;

                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => togglePantryItem(item.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.stapleCard,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.card,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.stapleIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.stapleName,
                          {
                            color: theme.text,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.stapleCat, { color: theme.textMuted }]}>
                        Raion: {item.cat} {price ? `• economisești ~${price} lei` : ''}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Text style={[styles.checkMark, { color: theme.primaryText }]}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Done Button */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: theme.primaryText }]}>✓ Salvează & Actualizează Coșul</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  contentCard: {
    width: '100%',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  savingsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  savingsSub: {
    fontSize: 12,
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 110,
  },
  savingsBadgeLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  savingsBadgeVal: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  bulkRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bulkBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  staplesGrid: {
    gap: 10,
    marginBottom: 24,
  },
  stapleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  stapleIcon: {
    fontSize: 24,
  },
  stapleName: {
    fontSize: 14,
  },
  stapleCat: {
    fontSize: 11,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
