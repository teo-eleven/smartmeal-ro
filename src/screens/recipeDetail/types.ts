import { AppTheme } from '../../styles/theme';

/** The app theme plus the three colours only this sheet uses. */
export type RecipeDetailTheme = AppTheme & {
  stepDoneBg: string;
  badgeBg: string;
  accentCard: string;
};
