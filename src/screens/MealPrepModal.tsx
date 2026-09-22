import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MealPlan, MealPrepPhase } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';

interface MealPrepModalProps {
  visible: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  isDark: boolean;
}

export const MealPrepModal: React.FC<MealPrepModalProps> = ({
  visible,
  onClose,
  plan,
  isDark,
}) => {
  const { contentMaxWidth } = useResponsive();
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  if (!visible || !plan) return null;

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Generate structured batch cooking guide tailored to the week's dishes
  const mealsCount = plan.days.reduce((acc, d) => acc + d.meals.length, 0);

  const prepPhases: MealPrepPhase[] = [
    {
      phaseNumber: 1,
      title: 'Mise en Place & Spălat Legume',
      durationMinutes: 20,
      icon: '🔪',
      description: 'Pregătește blatul de lucru, spală, curăță și toacă toate legumele simultan.',
      tasks: [
        {
          id: 'task_1_1',
          instruction: 'Curăță și toacă ceapa, usturoiul și rădăcinoasele (morcovi, țelină) în boluri separate.',
        },
        {
          id: 'task_1_2',
          instruction: 'Spală cartofii și taie-i wedges sau cuburi; păstrează-i în apă rece pentru a elimina excesul de amidon.',
        },
        {
          id: 'task_1_3',
          instruction: 'Porționează carnea (piept de pui / carne) și pune-o la marinat cu ulei, boia, sare, piper și usturoi.',
        },
      ],
    },
    {
      phaseNumber: 2,
      title: 'Cuptor & Air Fryer în Paralel',
      durationMinutes: 40,
      icon: '♨️',
      description: 'Folosește căldura cuptorului la maxim pentru a găti 2 tăvi mari în același timp.',
      tasks: [
        {
          id: 'task_2_1',
          instruction: 'Preîncălzește cuptorul la 200°C și tapetează 2 tăvi mari cu hârtie de copt.',
        },
        {
          id: 'task_2_2',
          instruction: 'Pe prima tavă așază legumele și cartofii condimentați; pe a doua tavă carnea marinată.',
        },
        {
          id: 'task_2_3',
          instruction: 'Coace timp de 35-40 de minute până când legumele sunt caramelizate și carnea este rumenită.',
        },
      ],
    },
    {
      phaseNumber: 3,
      title: 'Plită & Baze de Carbohidrați',
      durationMinutes: 20,
      icon: '🍳',
      description: 'Cât timp cuptorul lucrează singur, fierbe bazele pe ochiurile de la plită.',
      tasks: [
        {
          id: 'task_3_1',
          instruction: 'Fierbe orezul sau pastele în apă clocotită cu sare; răcește-le rapid cu jet de apă rece ca să nu se lipească.',
        },
        {
          id: 'task_3_2',
          instruction: 'Pregătește sosul de roșii cu usturoi și busuioc într-o tigaie adâncă (10 minute la foc mediu).',
        },
      ],
    },
    {
      phaseNumber: 4,
      title: 'Porționare în Caserole & Păstrare',
      durationMinutes: 10,
      icon: '🍱',
      description: 'Asamblarea caserolelor etanșe pentru frigider (3-4 zile) sau congelator.',
      tasks: [
        {
          id: 'task_4_1',
          instruction: 'Lasă preparatele să ajungă la temperatura camerei timp de 10-15 minute înainte de a pune capacele.',
        },
        {
          id: 'task_4_2',
          instruction: 'Împarte mâncarea în caserole de sticlă: carnea pe o parte, garnitura și legumele pe cealaltă parte.',
        },
      ],
    },
  ];

  const allTaskIds = prepPhases.flatMap((p) => p.tasks.map((t) => t.id));
  const doneCount = allTaskIds.filter((id) => completedTasks[id]).length;
  const progressPct = allTaskIds.length > 0 ? Math.round((doneCount / allTaskIds.length) * 100) : 0;

  const theme = getAppTheme(isDark);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.text }]}>🍱 Ghid Meal Prep Săptămânal</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Gătește {mealsCount} mese în avans duminică în ~90 de minute. Economisești timp în timpul săptămânii!
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
            {/* Overview Banner */}
            <View
              style={[
                styles.overviewBanner,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewTitle, { color: theme.text }]}>
                  Plan Batch Cooking: 90 Minute
                </Text>
                <Text style={[styles.overviewSub, { color: theme.textMuted }]}>
                  Progres: {doneCount} din {allTaskIds.length} pași finalizați ({progressPct}%)
                </Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.progressBadgeText, { color: theme.primaryText }]}>{progressPct}%</Text>
              </View>
            </View>

            {/* Prep Phases */}
            <View style={styles.phasesContainer}>
              {prepPhases.map((phase) => (
                <View
                  key={phase.phaseNumber}
                  style={[styles.phaseCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={styles.phaseHeader}>
                    <View
                      style={[
                        styles.phaseIconBadge,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                      ]}
                    >
                      <Text style={styles.phaseIconText}>{phase.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.phaseNumberLabel, { color: theme.primary }]}>
                        FAZA 0{phase.phaseNumber} • {phase.durationMinutes} MINUTE
                      </Text>
                      <Text style={[styles.phaseTitle, { color: theme.text }]}>
                        {phase.title}
                      </Text>
                      <Text style={[styles.phaseDesc, { color: theme.textMuted }]}>
                        {phase.description}
                      </Text>
                    </View>
                  </View>

                  {/* Tasks in Phase */}
                  <View style={styles.tasksList}>
                    {phase.tasks.map((task) => {
                      const isDone = Boolean(completedTasks[task.id]);
                      return (
                        <TouchableOpacity
                          accessibilityRole="button"
                          key={task.id}
                          onPress={() => toggleTask(task.id)}
                          activeOpacity={0.75}
                          style={[
                            styles.taskRow,
                            {
                              backgroundColor: isDone ? theme.primaryLight : theme.btnBg,
                              borderColor: isDone ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.taskCheckbox,
                              {
                                backgroundColor: isDone ? theme.primary : 'transparent',
                                borderColor: isDone ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            {isDone && <Text style={[styles.checkMark, { color: theme.primaryText }]}>✓</Text>}
                          </View>
                          <Text
                            style={[
                              styles.taskText,
                              {
                                color: isDone ? theme.textMuted : theme.text,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                              },
                            ]}
                          >
                            {task.instruction}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {/* Chef Pro Tips */}
            <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.tipsTitle, { color: theme.text }]}>💡 Sfaturile Bucătarului SmartMeal pentru Meal Prep</Text>
              <Text style={[styles.tipsBody, { color: theme.textMuted }]}>
                • Păstrează sosurile și dressingurile în borcănele separate până în momentul servirii.{'\n'}
                • Nu congela preparate care conțin cartofi fierți sau smântână — își schimbă textura.{'\n'}
                • Reîncălzește carnea la foc mediu cu 2 linguri de apă sau sos pentru a rămâne suculentă.
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: theme.primaryText }]}>✓ Gata! Înapoi la Meniu</Text>
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
  overviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  overviewSub: {
    fontSize: 12,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  phasesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  phaseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  phaseIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseIconText: {
    fontSize: 22,
  },
  phaseNumberLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  phaseDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  tasksList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  taskText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  tipsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  tipsBody: {
    fontSize: 12,
    lineHeight: 20,
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
