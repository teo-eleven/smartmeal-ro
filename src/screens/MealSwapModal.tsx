import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DayOfWeek, MealPlan, Recipe, UserPreferences } from '../types';
import { getEligibleRecipes } from '../engine/plannerEngine';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { aiProxyService, SmartSwapResult } from '../services/aiProxy';
import { MealSlot } from '../types';

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

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

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
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SmartSwapResult | null>(null);

  if (!visible || !dayOfWeek || !currentPlan) return null;

  const currentMealDay = currentPlan.days.find((d) => d.dayOfWeek === dayOfWeek);
  const targetMeal = slot ? currentMealDay?.meals?.find((m) => m.slot === slot) : null;
  const currentRecipe = targetMeal ? targetMeal.recipe : currentMealDay?.recipe;
  const currentRecipeId = currentRecipe?.id;
  const slotTitle = targetMeal ? ` ${targetMeal.slotLabelRo}` : '';

  // Find all eligible recipes that are not the current recipe
  const eligible = getEligibleRecipes(preferences);
  const usedRecipeIds = new Set(currentPlan.days.map((d) => d.recipe.id));

  // Prioritize recipes not currently used this week
  const unusedCandidates = eligible.filter((r) => !usedRecipeIds.has(r.id));
  const otherCandidates = eligible.filter(
    (r) => r.id !== currentRecipeId && usedRecipeIds.has(r.id)
  );
  const candidates = [...unusedCandidates, ...otherCandidates];

  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    aiBg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
    aiBorder: isDark ? '#4f46e5' : '#818cf8',
    aiText: isDark ? '#c7d2fe' : '#4338ca',
  };

  const handleAskAi = async () => {
    if (!currentRecipe) return;
    setIsAiLoading(true);
    try {
      const result = await aiProxyService.suggestSmartSwap(
        currentRecipe,
        candidates,
        preferences
      );
      setAiResult(result);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Schimbă{slotTitle ? ` ${slotTitle}` : ''} de {DAY_LABELS[dayOfWeek]}
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
                  {currentMealDay.recipe.title}
                </Text>
              </View>
            )}

            {/* AI Assistant Quick Trigger Banner */}
            <View style={[styles.aiBanner, { backgroundColor: theme.aiBg, borderColor: theme.aiBorder }]}>
              <View style={styles.aiBannerTextCol}>
                <Text style={[styles.aiBannerTitle, { color: theme.aiText }]}>
                  ✨ Asistent Culinar Inteligent
                </Text>
                <Text style={[styles.aiBannerDesc, { color: theme.textMuted }]}>
                  Găsește instant cea mai potrivită înlocuire calculată pentru profilul tău.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleAskAi}
                disabled={isAiLoading}
                style={[styles.aiTriggerBtn, { backgroundColor: theme.aiText }]}
              >
                {isAiLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.aiTriggerBtnText}>Întreabă AI</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* AI Suggestion Highlight Card if triggered */}
            {aiResult && (
              <View style={[styles.aiResultCard, { backgroundColor: theme.card, borderColor: '#10b981' }]}>
                <View style={styles.aiResultHeader}>
                  <Text style={styles.aiResultBadge}>
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
                  onPress={() => onSelectReplacement(aiResult.recipe)}
                  style={[styles.selectBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectBtnText}>Alege sugestia ({aiResult.recipe.prepTimeMinutes} min)</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Toate opțiunile compatibile ({candidates.length}):
            </Text>

            {/* List of replacement alternatives */}
            <View style={styles.candidatesList}>
              {candidates.map((candidate) => {
                const cost = calculateRecipePortionCost(
                  candidate,
                  currentPlan.peopleCount,
                  preferences.supermarketId,
                  preferences.excludePantryStaples
                );

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
                    <Text style={[styles.candidateTitle, { color: theme.text }]}>
                      {candidate.title}
                    </Text>
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
                        ~{cost} lei / porție
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => onSelectReplacement(candidate)}
                      style={[styles.selectBtn, { backgroundColor: theme.primary }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.selectBtnText}>Alege această rețetă</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
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
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    color: '#10b981',
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
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
