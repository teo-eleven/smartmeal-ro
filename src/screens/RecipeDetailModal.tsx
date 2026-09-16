import React, { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { MacroBar } from '../components/MacroBar';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  servings: number;
  visible: boolean;
  onClose: () => void;
  onSwap: () => void;
  isDark: boolean;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  servings: initialServings,
  visible,
  onClose,
  onSwap,
  isDark,
}) => {
  const [personalNotes, setPersonalNotes] = useState('');
  const [activeServings, setActiveServings] = useState(initialServings);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setActiveServings(initialServings);
    setCompletedSteps({});
  }, [initialServings, recipe]);

  if (!recipe) return null;

  const theme = {
    background: isDark ? '#0b1120' : '#f8fafc',
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
    inputBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    glassBg: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.85)',
    stepDoneBg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
  };

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const imageUri =
    recipe.imageUrl ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Floating Top Navigation */}
        <View style={[styles.topBar, { backgroundColor: theme.glassBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.circleBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.closeIcon, { color: theme.text }]}>✕</Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {recipe.title}
          </Text>

          <TouchableOpacity
            onPress={onSwap}
            style={[styles.swapHeaderBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          >
            <Text style={[styles.swapHeaderText, { color: theme.primary }]}>🔄 Schimbă</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Food Photography Header */}
          <View style={styles.heroContainer}>
            <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', isDark ? '#0b1120' : '#f8fafc']}
              style={styles.heroGradient}
            />

            <View style={styles.heroFloatingBadges}>
              <View style={[styles.heroPill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                <Text style={styles.heroPillText}>⏱️ {totalTime} min</Text>
              </View>
              <View style={[styles.heroPill, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                <Text style={styles.heroPillText}>🔥 {recipe.nutritionPerServing.calories} kcal/porție</Text>
              </View>
            </View>
          </View>

          <View style={styles.innerBox}>
            {/* Title & Tagline */}
            <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
            <Text style={[styles.description, { color: theme.textMuted }]}>
              {recipe.description}
            </Text>

            {/* Interactive Servings Stepper */}
            <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View>
                <Text style={[styles.stepperLabel, { color: theme.textMuted }]}>Porții calculate</Text>
                <Text style={[styles.stepperSubtext, { color: theme.primary }]}>
                  Ingredientele se scalează automat
                </Text>
              </View>

              <View style={styles.stepperControls}>
                <TouchableOpacity
                  onPress={() => setActiveServings((s) => Math.max(1, s - 1))}
                  style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                >
                  <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>

                <Text style={[styles.servingsCountText, { color: theme.text }]}>
                  {activeServings}
                </Text>

                <TouchableOpacity
                  onPress={() => setActiveServings((s) => Math.min(10, s + 1))}
                  style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                >
                  <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Macro Breakdown */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Valori nutriționale per porție
              </Text>
              <MacroBar nutrition={recipe.nutritionPerServing} isDark={isDark} />
            </View>

            {/* Ingredients Scaled List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Ingrediente ({activeServings} {activeServings === 1 ? 'porție' : 'porții'})
              </Text>
              <View style={[styles.ingredientsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {recipe.ingredients.map((ing, i) => {
                  const dbIng = INGREDIENTS[ing.ingredientId];
                  const scaledAmount = Math.round(ing.amountPerServing * activeServings * 10) / 10;

                  return (
                    <View
                      key={ing.ingredientId}
                      style={[
                        styles.ingredientRow,
                        i < recipe.ingredients.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.ingBullet}>
                        <Text style={{ color: theme.primary, fontSize: 14 }}>•</Text>
                      </View>
                      <Text style={[styles.ingredientName, { color: theme.text }]}>
                        {dbIng ? dbIng.name : ing.ingredientId}
                      </Text>
                      <View style={[styles.amountBadge, { backgroundColor: theme.inputBg }]}>
                        <Text style={[styles.ingredientAmount, { color: theme.primary }]}>
                          {scaledAmount} {ing.unit}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Cooking Instructions with interactive step progress */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Mod de preparare pas cu pas
              </Text>
              <View style={styles.stepsList}>
                {recipe.steps.map((step) => {
                  const isDone = Boolean(completedSteps[step.stepNumber]);

                  return (
                    <TouchableOpacity
                      key={step.stepNumber}
                      activeOpacity={0.8}
                      onPress={() => toggleStep(step.stepNumber)}
                      style={[
                        styles.stepCard,
                        {
                          backgroundColor: isDone ? theme.stepDoneBg : theme.card,
                          borderColor: isDone ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.stepBadge,
                          {
                            backgroundColor: isDone ? theme.primary : theme.primaryLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepNumberText,
                            { color: isDone ? '#ffffff' : theme.primary },
                          ]}
                        >
                          {isDone ? '✓' : `0${step.stepNumber}`}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.stepInstruction,
                          {
                            color: theme.text,
                            textDecorationLine: isDone ? 'line-through' : 'none',
                            opacity: isDone ? 0.6 : 1,
                          },
                        ]}
                      >
                        {step.instruction}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Personal Notes Field */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Notițele tale personale
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Ex: Adaugă mai mult usturoi data viitoare sau mai puțină sare..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={personalNotes}
                onChangeText={setPersonalNotes}
              />
            </View>

            {/* Bottom Floating Action Bar */}
            <TouchableOpacity
              onPress={onSwap}
              style={[styles.bigSwapBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.bigSwapBtnText}>🔄 Schimbă cu alt preparat</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: 220,
  },
  swapHeaderBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  swapHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  heroContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  heroFloatingBadges: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  heroPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  innerBox: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  servingsCountText: {
    fontSize: 16,
    fontWeight: '900',
    minWidth: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  ingredientsCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  ingBullet: {
    marginRight: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  amountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ingredientAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepsList: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepInstruction: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  bigSwapBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  bigSwapBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
