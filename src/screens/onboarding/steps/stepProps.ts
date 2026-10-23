import { AppTheme } from '../../../styles/theme';
import { OnboardingState } from '../useOnboardingState';

/** What every step reads: the wizard's state and actions, plus how to draw itself. */
export type OnboardingStepProps = OnboardingState & {
  isDark: boolean;
  isLargeScreen: boolean;
  theme: AppTheme;
  onOpenAccount?: () => void;
  onPlanGenerated?: () => void;
};
