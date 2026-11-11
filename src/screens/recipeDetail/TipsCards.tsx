import React from 'react';
import { Text, View } from 'react-native';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface ChefTipsCardProps {
  theme: RecipeDetailTheme;
  chefTips: string[];
}

export const ChefTipsCard: React.FC<ChefTipsCardProps> = ({ theme, chefTips }) => (
  <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.sectionHeading, { color: theme.text }]}>
      💡 Ponturile Bucătarului SmartMeal
    </Text>
    <View style={styles.tipsList}>
      {chefTips.map((tip, idx) => (
        <View
          key={idx}
          style={[styles.tipCard, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
        >
          <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
        </View>
      ))}
    </View>
  </View>
);

interface SubstitutionsCardProps {
  theme: RecipeDetailTheme;
  substitutions: { original: string; substitute: string }[];
}

export const SubstitutionsCard: React.FC<SubstitutionsCardProps> = ({ theme, substitutions }) => {
  if (substitutions.length === 0) return null;
  return (
    <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.sectionHeading, { color: theme.text }]}>
        🔄 Substituiri & Alternative în caz că-ți lipsește ceva
      </Text>
      <View style={styles.subsGrid}>
        {substitutions.map((sub, idx) => (
          <View
            key={idx}
            style={[styles.subCard, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
          >
            <Text style={[styles.subOriginal, { color: theme.textMuted }]}>
              Fără <Text style={{ fontWeight: '700', color: theme.text }}>{sub.original}</Text>?
            </Text>
            <Text style={[styles.subReplacement, { color: theme.primary }]}>
              ➜ Înlocuiește cu: <Text style={{ fontWeight: '700' }}>{sub.substitute}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
