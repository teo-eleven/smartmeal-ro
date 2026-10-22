import React from 'react';
import { Text, View } from 'react-native';
import { MoodOptionInfo } from '../../utils/moodCatalog';
import { DishArchetype } from '../../utils/recipeVisual';
import { getAppTheme } from '../../styles/theme';
import { MoodCardMedia } from './MoodCardMedia';
import { styles } from './styles';

interface MoodCardBodyProps {
  item: MoodOptionInfo;
  isDark: boolean;
  isSelected: boolean;
  theme: ReturnType<typeof getAppTheme>;
  stats?: { count: number; sampleTitles: string[] };
}

/** The inside of a craving card: photo header, badges, and a fixed-height text layout. */
export const MoodCardBody: React.FC<MoodCardBodyProps> = ({
  item,
  isDark,
  isSelected,
  theme,
  stats,
}) => {
  const archetype = (item.archetype || 'stew') as DishArchetype;
  const count = stats?.count ?? 0;
  const sampleDishes =
    stats && stats.sampleTitles.length > 0 ? stats.sampleTitles : item.sampleDishes || [];

  return (
    <View style={styles.cardContent}>
      {/* Top Media Header with appetizing food image */}
      <View style={styles.cardMediaArea}>
        <MoodCardMedia archetype={archetype} isDark={isDark} />

        {/* Top Badges Row */}
        <View style={styles.cardTopRow}>
          <View
            style={[
              styles.vibePill,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.92)',
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={styles.vibeIcon}>{item.icon}</Text>
            <Text style={[styles.vibeText, { color: theme.text }]}>{item.vibe}</Text>
          </View>

          {/* Right side recipe counter pill */}
          <View
            style={[
              styles.recipeCountPill,
              {
                backgroundColor: isSelected
                  ? '#30d158'
                  : count > 0
                    ? isDark
                      ? 'rgba(48,209,88,0.2)'
                      : 'rgba(48,209,88,0.15)'
                    : 'rgba(255,69,58,0.2)',
                borderColor: isSelected ? '#30d158' : count > 0 ? '#30d158' : '#ff453a',
              },
            ]}
          >
            <Text
              style={[
                styles.recipeCountText,
                { color: isSelected ? '#000000' : count > 0 ? '#30d158' : '#ff453a' },
              ]}
            >
              {isSelected
                ? `✓ ALES · ${count} rețete`
                : count > 0
                  ? `✨ ${count} rețete`
                  : '⚠️ 0 rețete'}
            </Text>
          </View>
        </View>

        {/* Big Food Icon in Center */}
        <View style={styles.centerIconWrap} pointerEvents="none">
          <Text style={styles.bigFoodIcon}>{item.icon}</Text>
        </View>
      </View>

      {/* Details Container - Strict Vertical Metrics to eliminate visual jumps */}
      <View style={styles.cardDetailsArea}>
        <View style={styles.cardTitleBox}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.label}
          </Text>
        </View>

        <View style={styles.cardDescBox}>
          <Text style={[styles.cardDesc, { color: theme.textMuted }]} numberOfLines={2}>
            {item.desc}
          </Text>
        </View>

        {/* Highlights Row (Fixed Height) */}
        <View style={styles.highlightsRow}>
          {(item.highlights || []).slice(0, 3).map((h, i) => (
            <View
              key={i}
              style={[
                styles.highlightTag,
                {
                  backgroundColor: theme.accentBg,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.highlightTagText, { color: theme.text }]} numberOfLines={1}>
                {h}
              </Text>
            </View>
          ))}
        </View>

        {/* Sample Dishes Row (Fixed Height) */}
        <View style={styles.sampleDishesBox}>
          <Text style={[styles.sampleDishesLabel, { color: theme.textMuted }]} numberOfLines={1}>
            Exemple în catalogul SmartMeal:
          </Text>
          <Text style={[styles.sampleDishesText, { color: theme.text }]} numberOfLines={2}>
            {sampleDishes.join(' · ')}
          </Text>
        </View>
      </View>
    </View>
  );
};
