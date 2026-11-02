import { FoodTier, MealSlot } from '../../types';
import { getAppTheme } from '../../styles/theme';

export function getSlotColor(slot?: MealSlot, isDark: boolean = true): string {
  switch (slot) {
    case 'breakfast':
      return '#f59e0b';
    case 'lunch':
      return isDark ? '#88B27A' : '#4E7A40';
    case 'dinner':
      return getAppTheme(isDark).primary;
    case 'snack':
      return '#ff9f0a';
    case 'dessert':
      return getAppTheme(isDark).accentHighlight;
    default:
      return getAppTheme(isDark).primary;
  }
}

export function getTierLabel(tier?: FoodTier): string {
  switch (tier) {
    case 'basic':
      return '🥉 Basic';
    case 'medium':
      return '🥈 Medium';
    case 'premium':
      return '🥇 Premium';
    default:
      return '';
  }
}

export function getTierBadgeStyle(
  tier?: FoodTier,
  isDark: boolean = true
): { bg: string; text: string } {
  const theme = getAppTheme(isDark);
  switch (tier) {
    case 'medium':
      return { bg: theme.primaryLight, text: theme.accentHighlight };
    case 'premium':
      return { bg: theme.primary, text: theme.primaryText };
    default:
      return { bg: theme.trackBg, text: theme.text };
  }
}

export const MOOD_LABELS: Record<string, string> = {
  speedy: '⚡ Rapid',
  low_calorie: '🥗 Low Calorie',
  family_fav: '❤️ Favorit Familie',
  healthy_comfort: '🍲 Comfort Food',
  fakeaway: '🍟 Fakeaway',
  high_protein: '💪 Proteic',
  romanian_classic: '🇷🇴 Tradițional',
  soups_stews: '🍲 Ciorbe & Supe',
  pasta_italian: '🍝 Paste Italiene',
  grill_meat: '🥩 Grătar & Fripturi',
  spicy_fiesta: '🌶️ Spicy & Aromat',
  light_dinner: '🌙 Cină Ușoară',
  fresh_salad: '🥗 Salate Fresh',
  sweet_treat: '🍰 Deserturi',
};
