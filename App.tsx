import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { env } from './config/env';
import { RECIPES } from './src/data/recipes';
import { SUPERMARKET_LIST } from './src/data/supermarkets';
import { INGREDIENTS, INGREDIENTS_LIST } from './src/data/ingredients';
import { PANTRY_STAPLES } from './src/data/pantryStaples';

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [recipeIdx, setRecipeIdx] = useState(0);

  const currentRecipe = RECIPES[recipeIdx];

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981', // emerald
    primaryLight: isDark ? '#064e3b' : '#d1fae5',
    primaryText: isDark ? '#a7f3d0' : '#065f46',
    border: isDark ? '#334155' : '#e2e8f0',
    accentBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  const nextRecipe = () => {
    setRecipeIdx((prev) => (prev + 1) % RECIPES.length);
  };

  const prevRecipe = () => {
    setRecipeIdx((prev) => (prev - 1 + RECIPES.length) % RECIPES.length);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header Badge */}
          <View style={[styles.badgeContainer, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.badgeText, { color: theme.primaryText }]}>🌱 SmartMeal RO</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>SmartMeal RO</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Planificare inteligentă de mese & optimizare buget supermarket
          </Text>

          {/* System & Runtime Sync Box */}
          <View style={[styles.statusBox, { backgroundColor: theme.accentBg }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Mediu:</Text>
              <Text style={[styles.statusValue, { color: theme.primary }]}>{env.appEnv}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Port Web:</Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>{env.port}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Temă activă:</Text>
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
              </Text>
            </View>
          </View>

          {/* Data Catalog Integration Metrics */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📊 Sincronizare Catalog de Date
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: theme.accentBg }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{RECIPES.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Rețete</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.accentBg }]}>
              <Text style={[styles.statNumber, { color: '#3b82f6' }]}>
                {SUPERMARKET_LIST.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Magazine</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.accentBg }]}>
              <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                {INGREDIENTS_LIST.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Ingrediente</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: theme.accentBg }]}>
              <Text style={[styles.statNumber, { color: '#ec4899' }]}>{PANTRY_STAPLES.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Cămară</Text>
            </View>
          </View>

          {/* Supermarkets Available */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🛒 Supermarketuri Active</Text>
          <View style={styles.supermarketsContainer}>
            {SUPERMARKET_LIST.map((market) => (
              <View
                key={market.id}
                style={[styles.marketPill, { borderColor: market.brandColor, backgroundColor: theme.accentBg }]}
              >
                <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
                <Text style={[styles.marketName, { color: theme.text }]}>{market.name}</Text>
              </View>
            ))}
          </View>

          {/* Interactive Recipe Showcase */}
          <View style={[styles.recipeBox, { borderColor: theme.border, backgroundColor: theme.accentBg }]}>
            <View style={styles.recipeHeaderRow}>
              <Text style={[styles.recipeIndex, { color: theme.primary }]}>
                Rețeta #{recipeIdx + 1} din {RECIPES.length}
              </Text>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={prevRecipe} style={styles.navBtn}>
                  <Text style={[styles.navBtnText, { color: theme.text }]}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextRecipe} style={styles.navBtn}>
                  <Text style={[styles.navBtnText, { color: theme.text }]}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.recipeTitle, { color: theme.text }]}>{currentRecipe.title}</Text>
            <Text style={[styles.recipeDesc, { color: theme.textMuted }]}>
              {currentRecipe.description}
            </Text>

            {/* Macros */}
            <View style={styles.macroRow}>
              <View style={styles.macroTag}>
                <Text style={styles.macroVal}>{currentRecipe.nutritionPerServing.calories}</Text>
                <Text style={styles.macroLbl}>kcal</Text>
              </View>
              <View style={styles.macroTag}>
                <Text style={styles.macroVal}>{currentRecipe.nutritionPerServing.proteinGrams}g</Text>
                <Text style={styles.macroLbl}>Proteine</Text>
              </View>
              <View style={styles.macroTag}>
                <Text style={styles.macroVal}>{currentRecipe.nutritionPerServing.carbsGrams}g</Text>
                <Text style={styles.macroLbl}>Carbo</Text>
              </View>
              <View style={styles.macroTag}>
                <Text style={styles.macroVal}>{currentRecipe.nutritionPerServing.fatGrams}g</Text>
                <Text style={styles.macroLbl}>Grăsimi</Text>
              </View>
            </View>

            {/* Ingredients snippet */}
            <Text style={[styles.subSubtitle, { color: theme.text }]}>
              Ingrediente necesare ({currentRecipe.ingredients.length}):
            </Text>
            <View style={styles.ingList}>
              {currentRecipe.ingredients.slice(0, 4).map((ing, i) => {
                const item = INGREDIENTS[ing.ingredientId];
                return (
                  <Text key={i} style={[styles.ingItem, { color: theme.textMuted }]}>
                    • {item ? item.name : ing.ingredientId}: {ing.amountPerServing}
                    {ing.unit}
                  </Text>
                );
              })}
              {currentRecipe.ingredients.length > 4 && (
                <Text style={[styles.ingItemMore, { color: theme.primary }]}>
                  + încă {currentRecipe.ingredients.length - 4} ingrediente
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            ✓ Datele și interfața sunt 100% sincronizate. Pregătit pentru Faza 3 (Planner Engine).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  badgeContainer: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 12,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statusBox: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  supermarketsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1.5,
    gap: 6,
  },
  marketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  marketName: {
    fontSize: 12,
    fontWeight: '700',
  },
  recipeBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  recipeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeIndex: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  navRow: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  recipeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  macroTag: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  macroLbl: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  subSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  ingList: {
    gap: 3,
  },
  ingItem: {
    fontSize: 12,
  },
  ingItemMore: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
