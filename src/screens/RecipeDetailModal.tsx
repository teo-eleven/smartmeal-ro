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
  servings,
  visible,
  onClose,
  onSwap,
  isDark,
}) => {
  const [personalNotes, setPersonalNotes] = useState('');

  if (!recipe) return null;

  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#1e293b' : '#f8fafc',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    inputBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Modal Top Bar */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.innerBox}>
            {/* Title & Tagline */}
            <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
            <Text style={[styles.description, { color: theme.textMuted }]}>
              {recipe.description}
            </Text>

            {/* Preparation time & servings banner */}
            <View style={[styles.timeBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.timeText, { color: theme.text }]}>
                ⏱️ Timp total: <Text style={{ fontWeight: '800' }}>{totalTime} min</Text> ({recipe.prepTimeMinutes}m pregătire + {recipe.cookTimeMinutes}m gătire)
              </Text>
              <Text style={[styles.servingsText, { color: theme.primary }]}>
                👥 Scalat pentru: <Text style={{ fontWeight: '800' }}>{servings} {servings === 1 ? 'porție' : 'porții'}</Text>
              </Text>
            </View>

            {/* Macro Breakdown */}
            <View style={styles.macroSection}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Valori nutriționale per porție
              </Text>
              <MacroBar nutrition={recipe.nutritionPerServing} isDark={isDark} />
            </View>

            {/* Ingredients List */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Ingrediente necesare ({servings} {servings === 1 ? 'porție' : 'porții'})
              </Text>
              <View style={[styles.ingredientsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {recipe.ingredients.map((ing, i) => {
                  const dbIng = INGREDIENTS[ing.ingredientId];
                  const scaledAmount = Math.round(ing.amountPerServing * servings * 10) / 10;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.ingRow,
                        i < recipe.ingredients.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 },
                      ]}
                    >
                      <Text style={[styles.ingName, { color: theme.text }]}>
                        {dbIng ? dbIng.name : ing.ingredientId}
                      </Text>
                      <Text style={[styles.ingAmount, { color: theme.primary }]}>
                        {scaledAmount} {ing.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Step-by-Step Cooking Directions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mod de preparare pas cu pas</Text>
              <View style={styles.stepsList}>
                {recipe.steps.map((step) => (
                  <View
                    key={step.stepNumber}
                    style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <View style={styles.stepNumCircle}>
                      <Text style={styles.stepNumText}>{step.stepNumber}</Text>
                    </View>
                    <Text style={[styles.stepInstruction, { color: theme.text }]}>
                      {step.instruction}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Personal Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Notițele tale pentru această rețetă</Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="Ex: mai puțină sare, adaugă mai mult usturoi data viitoare..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={personalNotes}
                onChangeText={setPersonalNotes}
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Swap Bar */}
        <View style={[styles.footerBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => {
              onClose();
              onSwap();
            }}
            style={[styles.swapActionButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.swapActionText}>🔄 Schimbă acest preparat</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 220,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  innerBox: {
    width: '100%',
    maxWidth: 480,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  timeBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  timeText: {
    fontSize: 13,
  },
  servingsText: {
    fontSize: 13,
  },
  macroSection: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  ingredientsCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  ingName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ingAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepInstruction: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  swapActionButton: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
