import fs from 'fs';
import path from 'path';

/**
 * Titles are set in Libre Caslon (stage T.8): the brand name, dish names and the title of
 * every screen and window. Body text stays in the system font.
 */
const TITLE_STYLES: [file: string, style: string][] = [
  ['../App.tsx', 'brandTitle'],
  ['screens/onboarding/OnboardingWizard.tsx', 'logoText'],
  ['components/AppLoadingScreen.tsx', 'brandName'],
  ['components/RecipeVisual.tsx', 'title'],
  ['screens/recipeDetail/styles.ts', 'title'],
  ['components/mealCard/styles.ts', 'eatenOutTitle'],
  ['styles/sheet.ts', 'title'],
  ['screens/onboarding/onboardingStyles.ts', 'questionTitle'],
  ['screens/LoginScreen.tsx', 'title'],
  ['screens/AuthModal.tsx', 'title'],
  ['screens/ReauthScreen.tsx', 'title'],
  ['screens/PaywallScreen.tsx', 'title'],
  ['components/ConfirmDialog.tsx', 'title'],
  ['components/BiometricOptInPrompt.tsx', 'title'],
  ['components/ErrorBoundary.tsx', 'title'],
  ['screens/BudgetOverrunModal.tsx', 'title'],
  ['screens/MealPrepModal.tsx', 'title'],
  ['screens/MealsPerDayModal.tsx', 'headerTitle'],
  ['screens/PantryInventoryModal.tsx', 'title'],
  ['screens/SnacksAndDrinksModal.tsx', 'modalTitle'],
  ['screens/WeeklyMacroModal.tsx', 'title'],
];
const SRC = path.join(__dirname, '..', '..');

function styleBlock(source: string, style: string): string | undefined {
  // One level of nesting allowed, for values such as textShadowOffset: { width, height }.
  const body = '([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)';
  return source.match(new RegExp(`\\n\\s*${style}:\\s*\\{${body}\\}`))?.[1];
}

test.each(TITLE_STYLES)('%s › %s is set in the title font', (file, style) => {
  const block = styleBlock(fs.readFileSync(path.join(SRC, file), 'utf8'), style);
  expect(block).toBeDefined();
  expect(block).toContain('...titleFont');
  // A heavier fontWeight next to the Bold file makes Android fall back to the system font.
  expect(block).not.toMatch(/fontWeight/);
});
