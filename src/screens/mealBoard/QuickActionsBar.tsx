import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AppState } from '../../store/useAppStore';
import { UserPreferences } from '../../types';
import { glass } from '../../styles/glass';
import { AppTheme } from '../../styles/theme';
import { styles } from './styles';

interface QuickActionsBarProps {
  theme: AppTheme;
  contentMaxWidth: number;
  preferences: UserPreferences;
  savedPlanCount: number;
  triggerReload: AppState['triggerReload'];
  reshufflePlan: AppState['reshufflePlan'];
  onOpenSavedPlans: () => void;
  onOpenStoreComparison: () => void;
  onOpenPantry: () => void;
  onOpenMealPrep: () => void;
  onOpenMacros: () => void;
}

/** Pantry matcher, meal prep, weekly macros and the other one-tap tools above the feed. */
export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  theme,
  contentMaxWidth,
  preferences,
  savedPlanCount,
  triggerReload,
  reshufflePlan,
  onOpenSavedPlans,
  onOpenStoreComparison,
  onOpenPantry,
  onOpenMealPrep,
  onOpenMacros,
}) => (
  <View
    {...glass('card')}
    style={[
      styles.quickActionsBar,
      { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth },
    ]}
  >
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Reîncarcă și regenerează meniul săptămânal"
      onPress={() => {
        void triggerReload(
          {
            title: 'Regenerăm meniul săptămânal...',
            subtitle: 'Selectăm variante culinare noi adaptate preferințelor tale...',
            icon: '🔄',
            steps: [
              'Verificăm ingredientele la preț de magazin',
              'Asigurăm varietatea meselor fără repetiții',
              'Actualizăm lista de cumpărături pe 7 raioane',
            ],
          },
          () => {
            reshufflePlan();
          }
        );
      }}
      {...glass('pill')}
      style={[styles.quickActionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>🔄</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Regenerează Meniul</Text>
        <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
          Variante noi pe săptămână
        </Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Planurile mele salvate"
      onPress={() => onOpenSavedPlans()}
      {...glass('pill')}
      style={[styles.quickActionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>⭐</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Planurile Mele</Text>
        <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
          {savedPlanCount > 0 ? `${savedPlanCount} salvate` : 'Salvează săptămâna curentă'}
        </Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Compară prețul coșului între supermarketuri"
      onPress={() => onOpenStoreComparison()}
      {...glass('pill')}
      style={[styles.quickActionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>🏷️</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Compară Magazine</Text>
        <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
          Același coș la toate cele 8 lanțuri
        </Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ce am în Cămară"
      onPress={() => onOpenPantry()}
      {...glass('pill')}
      style={[
        styles.quickActionBtn,
        {
          backgroundColor:
            (preferences.pantryInventory?.length || 0) > 0 ? theme.surfaceTertiary : theme.btnBg,
          borderColor:
            (preferences.pantryInventory?.length || 0) > 0 ? theme.borderStrong : theme.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>🏠</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Ce am în Cămară</Text>
        <Text
          style={[
            styles.quickActionSub,
            {
              color: (preferences.pantryInventory?.length || 0) > 0 ? theme.text : theme.textMuted,
            },
          ]}
        >
          {(preferences.pantryInventory?.length || 0) > 0
            ? `${preferences.pantryInventory?.length} deduse din coș ✓`
            : 'Bifează stocul de acasă'}
        </Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Ghid Meal Prep"
      onPress={() => onOpenMealPrep()}
      {...glass('pill')}
      style={[styles.quickActionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>🍱</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Ghid Meal Prep</Text>
        <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
          Batch cooking (90 min)
        </Text>
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Macro Săptămână"
      onPress={() => onOpenMacros()}
      {...glass('pill')}
      style={[styles.quickActionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.8}
    >
      <Text style={styles.quickActionIcon}>📊</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.quickActionTitle, { color: theme.text }]}>Macro Săptămână</Text>
        <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>Calorii & nutrienți</Text>
      </View>
    </TouchableOpacity>
  </View>
);
