import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MealPlan, SupermarketId, UserPreferences } from '../types';
import { compareBasketAcrossStores } from '../engine/storeComparator';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';

interface StoreComparisonModalProps {
  visible: boolean;
  plan: MealPlan | null;
  preferences: UserPreferences;
  onClose: () => void;
  onSwitchStore: (supermarketId: SupermarketId) => void;
  isDark: boolean;
}

export const StoreComparisonModal: React.FC<StoreComparisonModalProps> = ({
  visible,
  plan,
  preferences,
  onClose,
  onSwitchStore,
  isDark,
}) => {
  const theme = getAppTheme(isDark);

  if (!plan) return null;

  const comparison = compareBasketAcrossStores(plan, preferences);
  const { quotes, cheapest, current, maxSavingRon } = comparison;
  const priciest = quotes[quotes.length - 1];
  const spread = Math.max(priciest.totalCartCostRon - cheapest.totalCartCostRon, 0.01);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          {...glass('modal')}
          style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>Același coș, alt magazin</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Exact aceleași {plan.days.length} zile de mese, la fiecare lanț
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.verdict,
              {
                backgroundColor: maxSavingRon > 0 ? theme.warningBg : theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.verdictText,
                { color: maxSavingRon > 0 ? theme.warningText : theme.text },
              ]}
            >
              {maxSavingRon > 0
                ? `💰 Ai economisi ${maxSavingRon} lei pe săptămână mutând cumpărăturile la ${cheapest.name}.`
                : `✓ ${current.name} este deja cea mai ieftină opțiune pentru coșul tău.`}
            </Text>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {quotes.map((quote) => {
              const fillPercent = Math.round(
                ((quote.totalCartCostRon - cheapest.totalCartCostRon) / spread) * 100
              );

              return (
                <View
                  key={quote.supermarketId}
                  style={[
                    styles.row,
                    {
                      borderColor: quote.isCurrent ? theme.primary : theme.border,
                      backgroundColor: quote.isCurrent ? theme.surfaceSecondary : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.rowTop}>
                    <View style={[styles.dot, { backgroundColor: quote.brandColor }]} />
                    <Text style={[styles.storeName, { color: theme.text }]}>{quote.name}</Text>

                    {quote.isCheapest && (
                      <View style={[styles.badge, { backgroundColor: '#16a34a' }]}>
                        <Text style={styles.badgeText}>CEL MAI IEFTIN</Text>
                      </View>
                    )}
                    {quote.isCurrent && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={[styles.badgeText, { color: theme.primaryText }]}>ACUM</Text>
                      </View>
                    )}

                    <Text style={[styles.price, { color: theme.text }]}>
                      {quote.totalCartCostRon} lei
                    </Text>
                  </View>

                  <View style={[styles.barTrack, { backgroundColor: theme.trackBg }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, Math.max(4, fillPercent))}%`,
                          backgroundColor: quote.isCheapest ? '#16a34a' : quote.brandColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.rowBottom}>
                    <Text style={[styles.delta, { color: theme.textMuted }]}>
                      {quote.differenceVsCheapestRon === 0
                        ? 'referință'
                        : `+${quote.differenceVsCheapestRon} lei față de cel mai ieftin`}
                    </Text>

                    {!quote.isCurrent && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Mută cumpărăturile la ${quote.name}`}
                        onPress={() => {
                          onSwitchStore(quote.supermarketId);
                          onClose();
                        }}
                        style={[styles.switchBtn, { borderColor: theme.border }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.switchBtnText, { color: theme.text }]}>Mută aici</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {quote.unavailableRecipeTitles.length > 0 && (
                    <Text style={[styles.warning, { color: '#f59e0b' }]}>
                      ⚠️ {quote.unavailableRecipeTitles.length}{' '}
                      {quote.unavailableRecipeTitles.length === 1 ? 'rețetă' : 'rețete'} vor fi
                      înlocuite aici: {quote.unavailableRecipeTitles.slice(0, 2).join(', ')}
                      {quote.unavailableRecipeTitles.length > 2 ? '…' : ''}
                    </Text>
                  )}
                </View>
              );
            })}

            <Text style={[styles.footnote, { color: theme.textMuted }]}>
              Prețurile sunt estimări pe baza prețurilor uzuale de raft, nu oferte live. Promoțiile
              curente din magazin pot schimba totalul.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeBtnText: { fontSize: 18, fontWeight: '700' },
  verdict: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  verdictText: { fontSize: 13, fontWeight: '800', lineHeight: 19 },
  list: { marginTop: 14 },
  row: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  storeName: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 8, fontWeight: '900', color: '#ffffff', letterSpacing: 0.4 },
  price: { marginLeft: 'auto', fontSize: 15, fontWeight: '900' },
  barTrack: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  delta: { flex: 1, fontSize: 11, fontWeight: '600' },
  switchBtn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 6 },
  switchBtnText: { fontSize: 11, fontWeight: '800' },
  warning: { fontSize: 10, fontWeight: '700', marginTop: 8, lineHeight: 14 },
  footnote: { fontSize: 10, fontWeight: '500', lineHeight: 15, marginTop: 6, marginBottom: 10 },
});
