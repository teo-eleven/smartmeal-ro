import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Appliance, DayOfWeek, MoodTag, UserPreferences } from '../types';
import { getAppTheme } from '../styles/theme';

interface QuickFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onApplyFilters: (newPrefs: Partial<UserPreferences>) => void;
  onResetOnboarding: () => void;
  isDark: boolean;
}

const ALL_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lun',
  tuesday: 'Mar',
  wednesday: 'Mie',
  thursday: 'Joi',
  friday: 'Vin',
  saturday: 'Sâm',
  sunday: 'Dum',
};

const ALL_MOODS: { id: MoodTag; label: string; icon: string }[] = [
  { id: 'speedy', label: 'Rapid (<25m)', icon: '⚡' },
  { id: 'low_calorie', label: 'Low Calorie', icon: '🥗' },
  { id: 'high_protein', label: 'Proteic', icon: '💪' },
  { id: 'romanian_classic', label: 'Tradițional', icon: '🇷🇴' },
  { id: 'healthy_comfort', label: 'Comfort Food', icon: '🍲' },
  { id: 'pasta_italian', label: 'Paste', icon: '🍝' },
];

const ALL_APPLIANCES: { id: Appliance; label: string; icon: string }[] = [
  { id: 'hob', label: 'Aragaz / Plită', icon: '🔥' },
  { id: 'oven', label: 'Cuptor clasic', icon: '🍳' },
  { id: 'air_fryer', label: 'Air Fryer', icon: '🌪️' },
  { id: 'microwave', label: 'Microunde', icon: '⚡' },
];

export const QuickFiltersModal: React.FC<QuickFiltersModalProps> = ({
  visible,
  onClose,
  preferences,
  onApplyFilters,
  onResetOnboarding,
  isDark,
}) => {
  const [cookingDays, setCookingDays] = useState<DayOfWeek[]>(preferences.cookingDays);
  const [peopleCount, setPeopleCount] = useState<number>(preferences.peopleCount);
  const [budgetRon, setBudgetRon] = useState<number>(preferences.budgetRon);
  const [moodTags, setMoodTags] = useState<MoodTag[]>(preferences.moodTags);
  const [appliances, setAppliances] = useState<Appliance[]>(preferences.appliances || ['hob', 'oven']);
  const [budgetInputText, setBudgetInputText] = useState<string>(String(preferences.budgetRon));

  if (!visible) return null;

  const theme = getAppTheme(isDark);

  const toggleDay = (day: DayOfWeek) => {
    if (cookingDays.includes(day)) {
      if (cookingDays.length <= 1) return; // Must have at least 1 day
      setCookingDays(cookingDays.filter((d) => d !== day));
    } else {
      setCookingDays([...cookingDays, day]);
    }
  };

  const toggleMood = (mood: MoodTag) => {
    if (moodTags.includes(mood)) {
      setMoodTags(moodTags.filter((m) => m !== mood));
    } else {
      setMoodTags([...moodTags, mood]);
    }
  };

  const toggleAppliance = (app: Appliance) => {
    if (appliances.includes(app)) {
      if (appliances.length <= 1) return;
      setAppliances(appliances.filter((a) => a !== app));
    } else {
      setAppliances([...appliances, app]);
    }
  };

  const handleSave = () => {
    const finalBudget = Math.max(50, Number(budgetInputText) || budgetRon);
    onApplyFilters({
      cookingDays,
      peopleCount,
      budgetRon: finalBudget,
      moodTags,
      appliances,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Închide" onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Filtre & Preferințe Meniu</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSave}
            style={[styles.saveHeaderBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.saveHeaderBtnText, { color: theme.primaryText }]}>Aplică ✓</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.contentWrapper, { maxWidth: 560 }]}>
            {/* Section 1: Zile de Gătit */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📅 Zile de Gătit</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
                  {cookingDays.length} {cookingDays.length === 1 ? 'zi selectată' : 'zile selectate'}
                </Text>
              </View>

              <View style={styles.daysGrid}>
                {ALL_DAYS.map((day) => {
                  const isActive = cookingDays.includes(day);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={day}
                      onPress={() => toggleDay(day)}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isActive ? theme.primary : theme.btnBg,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          {
                            color: isActive ? theme.primaryText : theme.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {DAY_LABELS[day]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Număr Persoane */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>👥 Număr Persoane</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Dimensiune porții</Text>
              </View>

              <View style={styles.stepperRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                  style={[styles.stepperBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={[styles.stepperValueText, { color: theme.primary }]}>{peopleCount}</Text>
                  <Text style={[styles.stepperValueSub, { color: theme.textMuted }]}>
                    {peopleCount === 1 ? 'persoană' : 'persoane'}
                  </Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setPeopleCount(Math.min(8, peopleCount + 1))}
                  style={[styles.stepperBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Buget Săptămânal */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>💰 Buget Țintă (LEI)</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
                  {budgetInputText} LEI
                </Text>
              </View>

              <View style={styles.budgetRow}>
                <TextInput
                  style={[
                    styles.budgetInput,
                    { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                  ]}
                  keyboardType="numeric"
                  value={budgetInputText}
                  onChangeText={(val) => {
                    setBudgetInputText(val);
                    const num = Number(val);
                    if (!isNaN(num) && num > 0) setBudgetRon(num);
                  }}
                  placeholder="ex: 200"
                  placeholderTextColor={theme.textMuted}
                />
                <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>LEI / săptămână</Text>
              </View>

              {/* Quick Budget Presets */}
              <View style={styles.budgetPresetsRow}>
                {[100, 150, 200, 250, 350].map((amount) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={amount}
                    onPress={() => {
                      setBudgetRon(amount);
                      setBudgetInputText(String(amount));
                    }}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: Number(budgetInputText) === amount ? theme.primary : theme.btnBg,
                        borderColor: Number(budgetInputText) === amount ? theme.primary : theme.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetBtnText,
                        {
                          color: Number(budgetInputText) === amount ? theme.primaryText : theme.textMuted,
                          fontWeight: Number(budgetInputText) === amount ? '800' : '600',
                        },
                      ]}
                    >
                      {amount} lei
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section 4: Stiluri & Mood Tags */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Stiluri de Mâncare</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Preferințe culinare</Text>
              </View>

              <View style={styles.moodGrid}>
                {ALL_MOODS.map((mood) => {
                  const isActive = moodTags.includes(mood.id);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={mood.id}
                      onPress={() => toggleMood(mood.id)}
                      style={[
                        styles.moodChip,
                        {
                          backgroundColor: isActive ? theme.primary : theme.btnBg,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.moodChipIcon}>{mood.icon}</Text>
                      <Text
                        style={[
                          styles.moodChipText,
                          {
                            color: isActive ? theme.primaryText : theme.text,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 5: Aparate de Bucătărie */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🍳 Aparate Disponibile</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>Dotare</Text>
              </View>

              <View style={styles.appliancesGrid}>
                {ALL_APPLIANCES.map((app) => {
                  const isActive = appliances.includes(app.id);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={app.id}
                      onPress={() => toggleAppliance(app.id)}
                      style={[
                        styles.applianceChip,
                        {
                          backgroundColor: isActive ? theme.primary : theme.btnBg,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.applianceIcon}>{app.icon}</Text>
                      <Text
                        style={[
                          styles.applianceLabel,
                          {
                            color: isActive ? theme.primaryText : theme.text,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {app.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions Bottom Bar */}
            <View style={styles.bottomActionsCol}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleSave}
                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.applyBtnText, { color: theme.primaryText }]}>✓ Aplică Filtre & Actualizează Meniul</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  onResetOnboarding();
                }}
                style={[styles.resetOnboardingBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetOnboardingBtnText, { color: theme.textMuted }]}>
                  🔄 Reia Configuratorul Complet (de la zero)
                </Text>
              </TouchableOpacity>
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
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  saveHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  saveHeaderBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  contentWrapper: {
    width: '100%',
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dayChipText: {
    fontSize: 13,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 26,
    fontWeight: '900',
  },
  stepperValueSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  budgetInput: {
    width: 140,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '800',
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  moodChipIcon: {
    fontSize: 16,
  },
  moodChipText: {
    fontSize: 12,
  },
  appliancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  applianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  applianceIcon: {
    fontSize: 16,
  },
  applianceLabel: {
    fontSize: 12,
  },
  bottomActionsCol: {
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  applyBtn: {
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
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  resetOnboardingBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetOnboardingBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
