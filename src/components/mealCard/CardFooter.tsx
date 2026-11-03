import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PlannedMeal } from '../../types';
import { AppTheme } from '../../styles/theme';
import { styles } from './styles';

interface CardFooterProps {
  meal?: PlannedMeal;
  servings: number;
  isDessert: boolean;
  theme: AppTheme;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
  onToggleEatOut?: () => void;
  onCookDouble?: () => void;
  onUndoCookDouble?: () => void;
  onChangeServings?: (servings: number) => void;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  meal,
  servings,
  isDessert,
  theme,
  onPressRecipe,
  onSwapMeal,
  onToggleEatOut,
  onCookDouble,
  onUndoCookDouble,
  onChangeServings,
}) => (
  <View style={styles.footerContainer}>
    {/* Servings Meta Row & Optional Remove Button */}
    <View style={styles.footerMetaRow}>
      {onChangeServings ? (
        <View style={[styles.servingsStepper, { borderColor: theme.border }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Scade o porție"
            onPress={() => onChangeServings(servings - 1)}
            disabled={servings <= 1}
            style={styles.servingsStepBtn}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.servingsStepText,
                { color: servings <= 1 ? theme.border : theme.text },
              ]}
            >
              −
            </Text>
          </TouchableOpacity>

          <Text
            accessibilityLabel={`${servings} ${servings === 1 ? 'porție' : 'porții'}`}
            style={[styles.servingsText, { color: theme.textMuted }]}
          >
            👥 {servings}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Adaugă o porție"
            onPress={() => onChangeServings(servings + 1)}
            disabled={servings >= 12}
            style={styles.servingsStepBtn}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.servingsStepText,
                { color: servings >= 12 ? theme.border : theme.text },
              ]}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.servingsIndicator}>
          <Text style={[styles.servingsText, { color: theme.textMuted }]}>
            👥 {servings} {servings === 1 ? 'porție' : 'porții'}
          </Text>
        </View>
      )}
    </View>

    {/* Cheapest suggestion the planner can make, so it sits with the other actions */}
    {meal?.isLeftover
      ? onUndoCookDouble && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Gătesc din nou în ziua asta"
            onPress={onUndoCookDouble}
            style={[
              styles.leftoverBtn,
              {
                borderColor: theme.successBorder,
                backgroundColor: theme.successBg,
              },
            ]}
            activeOpacity={0.75}
          >
            <Text style={[styles.leftoverBtnText, { color: theme.successText }]}>
              ♻️ Reîncălzit din ziua de dinainte · gătesc din nou
            </Text>
          </TouchableOpacity>
        )
      : onCookDouble && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Gătesc porție dublă și reîncălzesc mâine"
            onPress={onCookDouble}
            style={[
              styles.leftoverBtn,
              { borderColor: theme.border, backgroundColor: theme.accentBg },
            ]}
            activeOpacity={0.75}
          >
            <Text style={[styles.leftoverBtnText, { color: theme.textMuted }]}>
              ♻️ Gătesc dublu · mâine doar reîncălzesc
            </Text>
          </TouchableOpacity>
        )}

    {/* Main Action Buttons: Perfectly sized, zero cutoff */}
    <View style={styles.actionButtonsRow}>
      {/* A reheated portion belongs to the day it was cooked on; the store refuses
                  to swap it, so offering the button would only be a dead tap. */}
      {!meal?.isLeftover && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Schimbă"
          onPress={onSwapMeal}
          style={[styles.swapBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.swapBtnText, { color: theme.text }]}>🔄 Schimbă</Text>
        </TouchableOpacity>
      )}

      {onToggleEatOut && !meal?.isLeftover && !isDessert && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mănânc în oraș la această masă"
          onPress={onToggleEatOut}
          style={[styles.eatOutBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.swapBtnText, { color: theme.text }]}>🍽️ În oraș</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPressRecipe}
        style={[styles.viewBtn, { backgroundColor: theme.primary }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.viewBtnText, { color: theme.primaryText }]}>Vezi Rețeta →</Text>
      </TouchableOpacity>
    </View>
  </View>
);
