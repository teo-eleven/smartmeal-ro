interface LintMessage {
  ruleId: string | null;
  message: string;
}
interface EslintModule {
  ESLint: new () => {
    lintText(code: string, options: { filePath: string }): Promise<{ messages: LintMessage[] }[]>;
  };
}
// eslint ships no type declarations; only what this test calls is described.
const { ESLint } = jest.requireActual<EslintModule>('eslint');

/**
 * The planner and eligibility engine must be reached through store/guardedEngine.ts, which
 * hands them effectivePreferences (A.11f-12). Importing them anywhere else would let a health
 * goal act before the safety answer allows it. The ESLint rule is what enforces it.
 */
const ENGINE_IMPORT = "import { getEligibleRecipes } from '../engine/plannerEngine';\nexport { getEligibleRecipes };\n";
const ELIGIBILITY_IMPORT = "import * as e from '../engine/eligibility';\nexport { e };\n";

async function restrictedImportMessages(filePath: string, code: string): Promise<string[]> {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports').map((m) => m.message);
}

describe('who may import the planner engine', () => {
  test.each([
    ['a screen', 'src/screens/SomeScreen.tsx'],
    ['a component', 'src/components/Some.tsx'],
    ['a store module', 'src/store/storeSomething.ts'],
    ['a util', 'src/utils/some.ts'],
  ])('%s is refused', async (_label, file) => {
    const planner = await restrictedImportMessages(file, ENGINE_IMPORT);
    const eligibility = await restrictedImportMessages(file, ELIGIBILITY_IMPORT);

    expect(planner).toHaveLength(1);
    expect(planner[0]).toMatch(/guardedEngine|effectivePreferences/);
    expect(eligibility).toHaveLength(1);
  });

  test.each([
    'src/engine/somethingNew.ts',
    'src/store/guardedEngine.ts',
    'src/components/EligibilityMeter.tsx',
    'src/screens/MealSwapModal.tsx',
    'src/screens/recipeDetail/useRecipeDetail.ts',
    'src/utils/swapCandidates.ts',
  ])('%s is a reviewed exception', async (file) => {
    expect(await restrictedImportMessages(file, ENGINE_IMPORT)).toEqual([]);
  });
});
