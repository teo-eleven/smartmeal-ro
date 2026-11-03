import fs from 'fs';
import path from 'path';

/**
 * Screens take every colour from the theme (src/styles/theme.ts), so the palette can change
 * in one place and every text keeps the contrast its tests promise. Paths join this list as
 * the theme reaches them (docs/HEALTH_CRAVINGS_STEPS.md, stage T).
 */
const THEMED_PATHS = [
  'screens/onboarding',
  'screens/mealBoard',
  'screens/MealBoardScreen.tsx',
  'components/mealCard',
  'components/MealCard.tsx',
  'components/PlanHeader.tsx',
  'components/PreGenerationSummaryCard.tsx',
  'screens/recipeDetail',
  'screens/RecipeDetailModal.tsx',
  'screens/BudgetOverrunModal.tsx',
  'screens/MealPrepModal.tsx',
  'screens/MealSwapModal.tsx',
  'screens/MealsPerDayModal.tsx',
  'screens/PantryInventoryModal.tsx',
  'screens/QuickFiltersModal.tsx',
  'screens/SavedPlansModal.tsx',
  'screens/SnacksAndDrinksModal.tsx',
  'screens/StoreComparisonModal.tsx',
  'screens/WeeklyMacroModal.tsx',
];
const SRC = path.join(__dirname, '..', '..');
const COLOUR_LITERAL = /['"`](#[0-9a-f]{3,8}|rgba?\([^'"`]*\))['"`]/gi;

function sourceFiles(dir: string): string[] {
  if (fs.statSync(dir).isFile()) return [dir];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test.each(THEMED_PATHS)('%s draws no colour of its own', (themedPath) => {
  const offenders = sourceFiles(path.join(SRC, themedPath)).flatMap((file) =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, at) =>
        [...line.matchAll(COLOUR_LITERAL)].map(
          (match) => `${path.relative(SRC, file)}:${at + 1} ${match[1]}`
        )
      )
  );
  expect(offenders).toEqual([]);
});
