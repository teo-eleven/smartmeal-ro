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

interface QuickActionProps {
  theme: AppTheme;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  /** The pantry tool once something is in the pantry. */
  isHighlighted?: boolean;
}

/**
 * One tool button, named by its visible title and subtitle so a voice-control user can say
 * what they see (WCAG 2.5.3). A hand-written label cannot match on the web, where the title
 * and subtitle reach axe joined without a space. The emoji is hidden from screen readers.
 */
const QuickAction: React.FC<QuickActionProps> = ({
  theme,
  icon,
  title,
  subtitle,
  onPress,
  isHighlighted = false,
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    onPress={onPress}
    {...glass('pill')}
    style={[
      styles.quickActionBtn,
      {
        backgroundColor: isHighlighted ? theme.surfaceTertiary : theme.btnBg,
        borderColor: isHighlighted ? theme.borderStrong : theme.border,
      },
    ]}
    activeOpacity={0.8}
  >
    <Text style={styles.quickActionIcon} aria-hidden>
      {icon}
    </Text>
    <View style={{ flex: 1 }}>
      <Text style={[styles.quickActionTitle, { color: theme.text }]}>{title}</Text>
      <Text
        style={[styles.quickActionSub, { color: isHighlighted ? theme.text : theme.textMuted }]}
      >
        {subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

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
}) => {
  const pantryCount = preferences.pantryInventory?.length || 0;
  return (
    <View
      {...glass('card')}
      style={[
        styles.quickActionsBar,
        { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth },
      ]}
    >
      <QuickAction
        theme={theme}
        icon="🔄"
        title="Regenerează Meniul"
        subtitle="Variante noi pe săptămână"
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
      />
      <QuickAction
        theme={theme}
        icon="⭐"
        title="Planurile Mele"
        subtitle={savedPlanCount > 0 ? `${savedPlanCount} salvate` : 'Salvează săptămâna curentă'}
        onPress={() => onOpenSavedPlans()}
      />
      <QuickAction
        theme={theme}
        icon="🏷️"
        title="Compară Magazine"
        subtitle="Același coș la toate cele 8 lanțuri"
        onPress={() => onOpenStoreComparison()}
      />
      <QuickAction
        theme={theme}
        icon="🏠"
        title="Ce am în Cămară"
        subtitle={pantryCount > 0 ? `${pantryCount} deduse din coș ✓` : 'Bifează stocul de acasă'}
        onPress={() => onOpenPantry()}
        isHighlighted={pantryCount > 0}
      />
      <QuickAction
        theme={theme}
        icon="🍱"
        title="Ghid Meal Prep"
        subtitle="Batch cooking (90 min)"
        onPress={() => onOpenMealPrep()}
      />
      <QuickAction
        theme={theme}
        icon="📊"
        title="Macro Săptămână"
        subtitle="Calorii & nutrienți"
        onPress={() => onOpenMacros()}
      />
    </View>
  );
};
