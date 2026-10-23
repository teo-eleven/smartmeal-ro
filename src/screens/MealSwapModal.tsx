import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DayOfWeek, MealPlan, MealSlot, Recipe, UserPreferences } from '../types';
import { aiProxyService, SmartSwapResult } from '../services/aiProxy';
import { getAppTheme } from '../styles/theme';
import { DAY_LABELS_RO } from '../constants/days';
import { formatCostDelta, rankSwapCandidates } from '../utils/swapCandidates';
import { useAppStore } from '../store/useAppStore';
import { getStoreBadgeBg, getStoreSignatureBadge } from '../utils/storeBadge';
import { useBlockingWindow } from '../hooks/useBlockingWindow';

interface MealSwapModalProps {
  visible: boolean;
  dayOfWeek: DayOfWeek | null;
  slot?: MealSlot | null;
  currentPlan: MealPlan | null;
  preferences: UserPreferences;
  onClose: () => void;
  onSelectReplacement: (recipe: Recipe) => void;
  isDark: boolean;
}

export const MealSwapModal: React.FC<MealSwapModalProps> = ({
  visible,
  dayOfWeek,
  slot,
  currentPlan,
  preferences,
  onClose,
  onSelectReplacement,
  isDark,
}) => {
  useBlockingWindow(visible);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SmartSwapResult | null>(null);

  // The modal stays mounted and only toggles `visible`, so without this the suggestion made
  // for Monday's lunch was still on screen -- with its "choose it" button -- when the modal
  // reopened for a different day.
  // Each AI request carries a number; a reply for an earlier day or slot is ignored. Without
  // it, Monday's late answer landed under Tuesday with a working "choose it" button.
  const aiRequestRef = useRef(0);

  useEffect(() => {
    aiRequestRef.current += 1;
    setAiResult(null);
    setIsAiLoading(false);
  }, [dayOfWeek, slot]);

  if (!visible || !dayOfWeek || !currentPlan) return null;

  const currentMealDay = currentPlan.days.find((d) => d.dayOfWeek === dayOfWeek);
  const targetMeal = slot ? currentMealDay?.meals?.find((m) => m.slot === slot) : null;
  const isDessertSlot =
    slot === 'dessert' || Boolean(targetMeal?.recipe.suitableSlots?.includes('dessert'));
  const slotTitle = targetMeal?.slotLabelRo || (isDessertSlot ? 'Desert de Casă' : '');
  const { currentRecipe, candidates: ranked } = rankSwapCandidates(
    currentPlan,
    preferences,
    dayOfWeek,
    slot ?? undefined
  );
  const candidates = ranked.map((c) => c.recipe);
  const servingsForCost = targetMeal?.servings ?? currentPlan.peopleCount;

  const appTheme = getAppTheme(isDark);
  const theme = {
    ...appTheme,
    aiBg: isDark ? 'rgba(230, 167, 86, 0.12)' : '#fef9c3',
    aiBorder: isDark ? 'rgba(230, 167, 86, 0.35)' : '#fde047',
    aiText: appTheme.text,
  };

  const handleAskAi = async () => {
    if (!currentRecipe) return;
    const requestId = ++aiRequestRef.current;
    setIsAiLoading(true);
    try {
      const result = await aiProxyService.suggestSmartSwap(currentRecipe, candidates, preferences);
      if (requestId === aiRequestRef.current) setAiResult(result);
    } catch (error) {
      console.warn('[MealSwapModal] AI suggestion failed:', error);
      if (requestId === aiRequestRef.current) {
        useAppStore
          .getState()
          .showNotice(
            'Sugestia AI nu e disponibilă',
            'Nu am putut cere o sugestie acum. Poți alege oricând din lista de mai jos.',
            'warning'
          );
      }
    } finally {
      if (requestId === aiRequestRef.current) setIsAiLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Închide" onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Schimbă{slotTitle ? ` ${slotTitle}` : ''} de {DAY_LABELS_RO[dayOfWeek]}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.innerBox}>
            {/* Currently Selected Note */}
            {currentMealDay && (
              <View style={[styles.currentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.currentLabel, { color: theme.textMuted }]}>
                  Rețetă curentă în plan:
                </Text>
                <Text style={[styles.currentTitle, { color: theme.text }]}>
                  {currentRecipe?.title || currentMealDay.recipe.title}
                </Text>
              </View>
            )}

            {/* AI Assistant Quick Trigger Banner */}
            <View style={[styles.aiBanner, { backgroundColor: theme.aiBg, borderColor: theme.aiBorder }]}>
              <View style={styles.aiBannerTextCol}>
                <Text style={[styles.aiBannerTitle, { color: theme.text }]}>
                  ✨ Asistent Culinar Inteligent
                </Text>
                <Text style={[styles.aiBannerDesc, { color: theme.textMuted }]}>
                  Găsește instant cea mai potrivită înlocuire calculată pentru profilul tău.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleAskAi}
                disabled={isAiLoading}
                style={[styles.aiTriggerBtn, { backgroundColor: theme.primary }]}
              >
                {isAiLoading ? (
                  <ActivityIndicator color={theme.primaryText} size="small" />
                ) : (
                  <Text style={[styles.aiTriggerBtnText, { color: theme.primaryText }]}>Întreabă AI</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* AI Suggestion Highlight Card if triggered */}
            {aiResult && (
              <View style={[styles.aiResultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.aiResultHeader}>
                  <Text style={[styles.aiResultBadge, { color: theme.primary }]}>
                    {aiResult.isAiGenerated ? '🤖 Sugestie Gemini AI' : '🎯 Sugestie Optimă'}
                  </Text>
                  <Text style={[styles.aiResultReason, { color: theme.textMuted }]}>
                    {aiResult.reason}
                  </Text>
                </View>

                <Text style={[styles.candidateTitle, { color: theme.text }]}>
                  {aiResult.recipe.title}
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => onSelectReplacement(aiResult.recipe)}
                  style={[styles.selectBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectBtnText, { color: theme.primaryText }]}>Alege sugestia ({aiResult.recipe.prepTimeMinutes} min)</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Toate opțiunile compatibile ({candidates.length}):
            </Text>

            {/* List of replacement alternatives */}
            <View style={styles.candidatesList}>
              {ranked.map(({ recipe: candidate, mealCostRon, costDeltaRon, fitsBudget }) => {
                // The cost is for the whole meal; it was labelled "per portion" for a household.
                const perPortion = Math.round((mealCostRon / Math.max(1, servingsForCost)) * 100) / 100;

                const isSuggested = aiResult?.recipe.id === candidate.id;

                return (
                  <View
                    key={candidate.id}
                    style={[
                      styles.candidateCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSuggested ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <View style={styles.candidateHeaderRow}>
                      <Text style={[styles.candidateTitle, { color: theme.text, flex: 1 }]}>
                        {candidate.title}
                      </Text>
                      {getStoreSignatureBadge(candidate, preferences.supermarketId) && (
                        <View style={[styles.storeBadge, { backgroundColor: getStoreBadgeBg(candidate.storeSignature) }]}>
                          <Text style={styles.storeBadgeText}>{candidate.storeBadgeLabel}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.candidateDesc, { color: theme.textMuted }]}>
                      {candidate.description}
                    </Text>

                    {/* Metrics */}
                    <View style={styles.metricsRow}>
                      <Text style={[styles.metricText, { color: theme.textMuted }]}>
                        ⏱️ {candidate.prepTimeMinutes} min
                      </Text>
                      <Text style={[styles.metricText, { color: theme.textMuted }]}>
                        🔥 {candidate.nutritionPerServing.calories} kcal
                      </Text>
                      <Text style={[styles.costText, { color: theme.primary }]}>
                        ~{perPortion} lei / porție
                      </Text>
                      <Text
                        style={[
                          styles.costText,
                          { color: fitsBudget ? theme.textMuted : '#f97316' },
                        ]}
                        accessibilityLabel={`Costul săptămânii: ${formatCostDelta(costDeltaRon)}${fitsBudget ? '' : ', peste buget'}`}
                      >
                        {formatCostDelta(costDeltaRon)}
                        {fitsBudget ? '' : ' · peste buget'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => onSelectReplacement(candidate)}
                      style={[styles.selectBtn, { backgroundColor: theme.primary }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.selectBtnText, { color: theme.primaryText }]}>Alege această rețetă</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  innerBox: {
    width: '100%',
    maxWidth: 480,
  },
  currentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  aiBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  aiTriggerBtn: {
    borderRadius: 10,
    minHeight: 44,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiTriggerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  aiResultCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 14,
    marginBottom: 16,
  },
  aiResultHeader: {
    marginBottom: 6,
  },
  aiResultBadge: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  aiResultReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  candidatesList: {
    gap: 14,
  },
  candidateCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
  },
  candidateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  candidateDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  costText: {
    fontSize: 13,
    fontWeight: '800',
  },
  selectBtn: {
    borderRadius: 12,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  candidateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  storeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  storeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
