import fs from 'fs';
import path from 'path';

/**
 * The bronze rim is kept for the few cards that matter (stage T.9): one on every card would
 * make it noise. A new card earns it here, on purpose.
 */
const RIMMED_CARDS = [
  'components/MealCard.tsx',
  'screens/recipeDetail/RecipeSummaryCard.tsx',
  'components/PreGenerationSummaryCard.tsx',
];
const SRC = path.join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test.each(RIMMED_CARDS)('%s wears the bronze rim', (card) => {
  expect(fs.readFileSync(path.join(SRC, card), 'utf8')).toContain('theme.cardRim');
});

test('the meal card asks the web stylesheet for its rim too', () => {
  expect(fs.readFileSync(path.join(SRC, 'components/MealCard.tsx'), 'utf8')).toContain(
    "glass('card-rim')"
  );
});

test('no other card wears the rim', () => {
  const wearers = sourceFiles(SRC)
    .filter((file) => /cardRim|card-rim/.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(SRC, file))
    .filter((file) => !['styles/theme.ts', 'styles/glass.ts'].includes(file));
  expect(wearers.sort()).toEqual([...RIMMED_CARDS].sort());
});
