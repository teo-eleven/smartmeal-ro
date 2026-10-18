import React, { useEffect, useState } from 'react';
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
import { DayOfWeek, MealSlot } from '../types';
import { getAppTheme } from '../styles/theme';
import { useResponsive } from '../hooks/useResponsive';

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

interface MealsPerDayModalProps {
  visible: boolean;
  initialCount?: 1 | 2 | 3;
  onClose: () => void;
  isDark: boolean;
}

const AVAILABLE_SLOTS: { slot: MealSlot; label: string; icon: string }[] = [
  { slot: 'breakfast', label: 'Mic dejun', icon: '☀️' },
  { slot: 'lunch', label: 'Prânz', icon: '🍲' },
  { slot: 'dinner', label: 'Cină', icon: '🍽️' },
];

export const MealsPerDayModal: React.FC<MealsPerDayModalProps> = ({
  visible,
  initialCount = 1,
  onClose,
  isDark,
}) => {
  const { currentPlan, preferences, setDailyMealSlots } = useAppStore();
  const theme = getAppTheme(isDark);
  const { contentMaxWidth } = useResponsive();

  const [activeCount, setActiveCount] = useState<1 | 2 | 3>(initialCount);
  const [dailySlots, setDailySlots] = useState<Partial<Record<DayOfWeek, MealSlot[]>>>({});

  // Synchronize initial state when opened
  useEffect(() => {
    if (!visible || !currentPlan) return;

    setActiveCount(initialCount);

    const initialMap: Partial<Record<DayOfWeek, MealSlot[]>> = {};
    currentPlan.days.forEach((day) => {
      const existing = preferences.dailyMealSlots?.[day.dayOfWeek];
      if (existing && existing.length > 0) {
        initialMap[day.dayOfWeek] = existing.slice(0, initialCount);
      } else {
        const defaultSlots: MealSlot[] =
          initialCount === 1
            ? ['dinner']
            : initialCount === 2
              ? ['lunch', 'dinner']
              : ['breakfast', 'lunch', 'dinner'];
        initialMap[day.dayOfWeek] = defaultSlots;
      }
    });

    setDailySlots(initialMap);
  }, [visible, initialCount, currentPlan, preferences.dailyMealSlots]);

  const handleToggleSlotForDay = (day: DayOfWeek, slot: MealSlot) => {
    const current = dailySlots[day] || [];

    if (activeCount === 1) {
      // In 1-meal mode, tapping a slot immediately switches to that slot
      setDailySlots((prev) => ({
        ...prev,
        [day]: [slot],
      }));
      return;
    }

    if (activeCount === 2) {
      if (current.includes(slot)) {
        // Only allow unselecting if there is at least 1 remaining
        if (current.length > 1) {
          setDailySlots((prev) => ({
            ...prev,
            [day]: current.filter((s) => s !== slot),
          }));
        }
      } else {
        if (current.length < 2) {
          setDailySlots((prev) => ({
            ...prev,
            [day]: [...current, slot],
          }));
        } else {
          // If already has 2, drop the first and append the new one
          setDailySlots((prev) => ({
            ...prev,
            [day]: [current[1], slot],
          }));
        }
      }
      return;
    }

    if (activeCount === 3) {
      // In 3-meal mode, keep all 3
      setDailySlots((prev) => ({
        ...prev,
        [day]: ['breakfast', 'lunch', 'dinner'],
      }));
    }
  };

  const applyPresetToAll = (slots: MealSlot[]) => {
    if (!currentPlan) return;
    const nextMap: Partial<Record<DayOfWeek, MealSlot[]>> = {};
    currentPlan.days.forEach((day) => {
      nextMap[day.dayOfWeek] = [...slots];
    });
    setDailySlots(nextMap);
  };

  const handleSwitchCount = (newCount: 1 | 2 | 3) => {
    setActiveCount(newCount);
    if (!currentPlan) return;

    const nextMap: Partial<Record<DayOfWeek, MealSlot[]>> = {};
    currentPlan.days.forEach((day) => {
      const current = dailySlots[day.dayOfWeek] || [];
      if (newCount === 1) {
        nextMap[day.dayOfWeek] = current.length > 0 ? [current[0]] : ['dinner'];
      } else if (newCount === 2) {
        if (current.length >= 2) {
          nextMap[day.dayOfWeek] = current.slice(0, 2);
        } else if (current.length === 1) {
          const complement: MealSlot = current[0] === 'breakfast' ? 'lunch' : 'dinner';
          nextMap[day.dayOfWeek] = [current[0], complement];
        } else {
          nextMap[day.dayOfWeek] = ['lunch', 'dinner'];
        }
      } else {
        nextMap[day.dayOfWeek] = ['breakfast', 'lunch', 'dinner'];
      }
    });
    setDailySlots(nextMap);
  };

  const handleConfirm = () => {
    setDailyMealSlots(dailySlots, activeCount);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              🍽️ Personalizează Mesele pe Zile
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              {activeCount === 1 && 'Alege care masă vrei să fie gătită în fiecare zi (1 masă / zi).'}
              {activeCount === 2 && 'Selectează cele 2 mese preferate pentru fiecare zi din săptămână.'}
              {activeCount === 3 && 'Toate cele 3 mese principale (Mic Dejun, Prânz și Cină) sunt incluse.'}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.innerContent, { maxWidth: contentMaxWidth }]}>
            {/* Frequency Segmented Switcher */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Frecvență dorită mese:
              </Text>
              <View style={[styles.segmentedControl, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                {([1, 2, 3] as const).map((cnt) => {
                  const isActive = activeCount === cnt;
                  return (
                    <TouchableOpacity
                      key={cnt}
                      accessibilityRole="button"
                      onPress={() => handleSwitchCount(cnt)}
                      style={[
                        styles.segmentBtn,
                        isActive && { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          {
                            color: isActive ? theme.primaryText : theme.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {cnt} {cnt === 1 ? 'Masă / zi' : 'Mese / zi'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Preset Shortcuts */}
              <View style={styles.presetsWrapper}>
                <Text style={[styles.presetsTitle, { color: theme.textMuted }]}>
                  Scurtături rapide pentru toate zilele:
                </Text>
                <View style={styles.presetsRow}>
                  {activeCount === 1 && (
                    <>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['breakfast'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>☀️ Doar Mic Dejun</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['lunch'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>🍲 Doar Prânz</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['dinner'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>🍽️ Doar Cină</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {activeCount === 2 && (
                    <>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['lunch', 'dinner'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>🍲 Prânz + 🍽️ Cină</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['breakfast', 'dinner'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>☀️ Mic Dejun + 🍽️ Cină</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => applyPresetToAll(['breakfast', 'lunch'])}
                        style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetPillText, { color: theme.text }]}>☀️ Mic Dejun + 🍲 Prânz</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {activeCount === 3 && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => applyPresetToAll(['breakfast', 'lunch', 'dinner'])}
                      style={[styles.presetPill, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.presetPillText, { color: theme.text }]}>✨ Toate cele 3 mese</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Day-by-Day List */}
            <View style={styles.daysListContainer}>
              <Text style={[styles.listHeading, { color: theme.text }]}>
                Configurație pe fiecare zi din săptămână:
              </Text>

              {currentPlan?.days.map((day) => {
                const selectedForDay = dailySlots[day.dayOfWeek] || [];

                return (
                  <View
                    key={day.dayOfWeek}
                    style={[
                      styles.dayRowCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.dayLabelGroup}>
                      <Text style={[styles.dayLabelText, { color: theme.text }]}>
                        📅 {DAY_LABELS[day.dayOfWeek]}
                      </Text>
                      <Text style={[styles.daySelectedSummary, { color: theme.textMuted }]}>
                        {selectedForDay.length} {selectedForDay.length === 1 ? 'masă aleasă' : 'mese alese'}
                      </Text>
                    </View>

                    <View style={styles.slotsRow}>
                      {AVAILABLE_SLOTS.map(({ slot, label, icon }) => {
                        const isSelected = selectedForDay.includes(slot);
                        return (
                          <TouchableOpacity
                            key={slot}
                            accessibilityRole="button"
                            onPress={() => handleToggleSlotForDay(day.dayOfWeek, slot)}
                            style={[
                              styles.slotPill,
                              {
                                backgroundColor: isSelected ? theme.primary : theme.btnBg,
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.slotPillText,
                                {
                                  color: isSelected ? theme.primaryText : theme.text,
                                  fontWeight: isSelected ? '800' : '600',
                                },
                              ]}
                            >
                              {icon} {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Bottom Confirm Button */}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmBtnText, { color: theme.primaryText }]}>
                ✓ Aplică Mesele Selectate & Reîncarcă Meniul
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
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
  innerContent: {
    width: '100%',
    gap: 16,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentBtnText: {
    fontSize: 13,
  },
  presetsWrapper: {
    marginTop: 4,
    gap: 8,
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysListContainer: {
    gap: 10,
  },
  listHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  dayRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  dayLabelGroup: {
    minWidth: 110,
  },
  dayLabelText: {
    fontSize: 14,
    fontWeight: '800',
  },
  daySelectedSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotPillText: {
    fontSize: 12,
  },
  confirmBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
