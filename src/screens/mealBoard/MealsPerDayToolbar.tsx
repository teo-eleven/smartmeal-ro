import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { FoodTier } from '../../types';
import { glass } from '../../styles/glass';
import { AppTheme } from '../../styles/theme';
import { styles } from './styles';

/** Spoken names for the tier segment; the visible labels start with a medal emoji. */
const TIER_NAMES: Record<FoodTier, string> = {
  basic: 'Basic',
  medium: 'Medium',
  premium: 'Premium',
};

interface MealsPerDayToolbarProps {
  theme: AppTheme;
  isDark: boolean;
  isDesktop: boolean;
  contentMaxWidth: number;
  baseMealsCount: number;
  foodTier?: FoodTier;
  setMealsModalInitialCount: (count: 1 | 2 | 3) => void;
  setMealsModalVisible: (visible: boolean) => void;
  setMealsPerDayCount: (count: 1 | 2 | 3) => void;
  setFoodTier: (tier: FoodTier) => void;
}

/** The 1, 2 or 3 meals a day switcher, and the ingredient tier next to it. */
export const MealsPerDayToolbar: React.FC<MealsPerDayToolbarProps> = ({
  theme,
  isDark,
  isDesktop,
  contentMaxWidth,
  baseMealsCount,
  foodTier,
  setMealsModalInitialCount,
  setMealsModalVisible,
  setMealsPerDayCount,
  setFoodTier,
}) => {
  const getTierColor = (tier?: FoodTier): string => {
    switch (tier) {
      case 'basic':
        return theme.textMuted;
      case 'medium':
        return theme.primary;
      case 'premium':
        return isDark ? '#F3C06D' : '#C88232';
      default:
        return theme.primary;
    }
  };

  return (
    <View
      {...glass('card')}
      style={[
        styles.mealsPerDayCard,
        { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth },
      ]}
    >
      <View style={[styles.toolbarControlsWrapper, isDesktop && styles.toolbarDesktopRow]}>
        {/* Section 1: Meals per Day */}
        <View style={[styles.toolbarSection, isDesktop && styles.toolbarSectionDesktop]}>
          <View style={styles.mealsPerDayHeader}>
            <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>Mese pe zi:</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Personalizează pe zile"
              onPress={() => {
                setMealsModalInitialCount((baseMealsCount as 1 | 2 | 3) || 1);
                setMealsModalVisible(true);
              }}
              style={[
                styles.customizeDaysBtn,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.customizeDaysBtnText, { color: theme.primary }]}>
                ⚙️ Personalizează pe zile
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.segmentedControl,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
          >
            {([1, 2, 3] as const).map((cnt) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: baseMealsCount === cnt }}
                key={cnt}
                onPress={() => {
                  if (cnt === 3) {
                    setMealsPerDayCount(3);
                  } else {
                    setMealsModalInitialCount(cnt);
                    setMealsModalVisible(true);
                  }
                }}
                {...glass(baseMealsCount === cnt ? 'pill-active' : 'pill')}
                style={[
                  styles.segmentBtn,
                  baseMealsCount === cnt && [
                    styles.segmentBtnActive,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                  ],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: baseMealsCount === cnt ? theme.primaryText : theme.textMuted,
                      fontWeight: baseMealsCount === cnt ? '800' : '600',
                    },
                  ]}
                >
                  {cnt} {cnt === 1 ? 'Masă' : 'Mese'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Desktop Vertical Divider */}
        {isDesktop && <View style={[styles.toolbarDividerV, { backgroundColor: theme.border }]} />}

        {/* Section 2: Food Tier */}
        <View style={[styles.toolbarSection, isDesktop && styles.toolbarSectionDesktop]}>
          <View style={styles.mealsPerDayHeader}>
            <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>Nivel ingrediente:</Text>
            <Text style={[styles.mealsPerDaySubtitle, { color: getTierColor(foodTier) }]}>
              {foodTier === 'basic' && '🥉 Basic (~8-12 lei)'}
              {foodTier === 'medium' && '🥈 Medium (~13-18 lei)'}
              {foodTier === 'premium' && '🥇 Premium (~20-35+ lei)'}
            </Text>
          </View>

          <View
            style={[
              styles.segmentedControl,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
          >
            {(['basic', 'medium', 'premium'] as FoodTier[]).map((tier) => {
              const isActive = (foodTier || 'medium') === tier;
              const label =
                tier === 'basic' ? '🥉 Basic' : tier === 'medium' ? '🥈 Med' : '🥇 Prem';
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Nivel ingrediente ${TIER_NAMES[tier]}`}
                  accessibilityState={{ selected: isActive }}
                  key={tier}
                  onPress={() => {
                    if (foodTier === tier) return;
                    setFoodTier(tier);
                  }}
                  {...glass(isActive ? 'pill-active' : 'pill')}
                  style={[
                    styles.segmentBtn,
                    isActive && [
                      styles.segmentBtnActive,
                      {
                        backgroundColor:
                          tier === 'basic'
                            ? theme.surfaceSecondary
                            : tier === 'medium'
                              ? theme.primaryLight
                              : isDark
                                ? 'rgba(243, 192, 109, 0.22)'
                                : 'rgba(200, 130, 50, 0.16)',
                        borderColor:
                          tier === 'basic'
                            ? theme.borderStrong
                            : tier === 'medium'
                              ? theme.primary
                              : isDark
                                ? '#F3C06D'
                                : '#C88232',
                      },
                    ],
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isActive
                          ? tier === 'basic'
                            ? theme.text
                            : tier === 'medium'
                              ? theme.primary
                              : isDark
                                ? '#F3C06D'
                                : '#C88232'
                          : theme.textMuted,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};
