import { FoodTier, MealSlot } from '../../types';

export function getSlotColor(slot?: MealSlot, isDark: boolean = true): string {
  switch (slot) {
    case 'breakfast':
      return '#f59e0b';
    case 'lunch':
      return isDark ? '#88B27A' : '#4E7A40';
    case 'dinner':
      return isDark ? '#E6A756' : '#C88232';
    case 'snack':
      return '#ff9f0a';
    case 'dessert':
      return isDark ? '#F3C06D' : '#D98E3A';
    default:
      return isDark ? '#E6A756' : '#C88232';
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
  switch (tier) {
    case 'basic':
      return {
        bg: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(42, 32, 26, 0.08)',
        text: isDark ? '#F5EFEB' : '#2A201A',
      };
    case 'medium':
      return {
        bg: isDark ? 'rgba(230, 167, 86, 0.22)' : 'rgba(217, 142, 58, 0.18)',
        text: isDark ? '#F3C06D' : '#C88232',
      };
    case 'premium':
      return {
        bg: isDark ? '#E6A756' : '#C88232',
        text: '#131914',
      };
    default:
      return {
        bg: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(42, 32, 26, 0.08)',
        text: isDark ? '#F5EFEB' : '#2A201A',
      };
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
