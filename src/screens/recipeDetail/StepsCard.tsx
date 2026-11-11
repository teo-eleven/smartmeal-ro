import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Recipe } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface StepsCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  completedSteps: Record<number, boolean>;
  onToggleStep: (stepNumber: number) => void;
}

/** The method, one tappable card per step, with a progress bar that fills as they are ticked. */
export const StepsCard: React.FC<StepsCardProps> = ({
  recipe,
  theme,
  completedSteps,
  onToggleStep,
}) => {
  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const totalStepsCount = recipe.steps.length;
  const progressPercent =
    totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  return (
    <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.stepsHeaderRow}>
        <View>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            👨‍🍳 Mod de preparare pas cu pas
          </Text>
          <Text style={[styles.stepsSubtitle, { color: theme.textMuted }]}>
            {completedStepsCount} din {totalStepsCount} pași finalizați ({progressPercent}%)
          </Text>
        </View>

        <View
          style={[
            styles.progressBadge,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.progressBadgeText, { color: theme.primary }]}>
            {progressPercent === 100 ? '🎉 Gata de servit!' : `${progressPercent}%`}
          </Text>
        </View>
      </View>

      {/* Micro Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progressPercent}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>

      {/* Steps Cards List */}
      <View style={styles.stepsList}>
        {recipe.steps.map((step) => {
          const isDone = Boolean(completedSteps[step.stepNumber]);

          return (
            <TouchableOpacity
              accessibilityRole="checkbox"
              aria-checked={isDone}
              key={step.stepNumber}
              activeOpacity={0.8}
              onPress={() => onToggleStep(step.stepNumber)}
              style={[
                styles.stepCard,
                {
                  backgroundColor: isDone ? theme.stepDoneBg : theme.accentCard,
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
                    { color: isDone ? theme.primaryText : theme.primary },
                  ]}
                >
                  {isDone ? '✓' : `0${step.stepNumber}`}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.stepInstruction,
                    {
                      color: theme.text,
                      textDecorationLine: isDone ? 'line-through' : 'none',
                      opacity: isDone ? 0.65 : 1,
                    },
                  ]}
                >
                  {step.instruction}
                </Text>
                <Text
                  style={[
                    styles.stepDonePrompt,
                    { color: isDone ? theme.primary : theme.textMuted },
                  ]}
                >
                  {isDone ? '✓ Pas bifat ca finalizat' : 'Apasă pentru a bifa pasul'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
