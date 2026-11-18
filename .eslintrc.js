module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    node: true,
    browser: true,
    es2021: true,
    jest: true
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'coverage/'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    // The planner and eligibility engine see health goals, so they are reached through
    // store/guardedEngine.ts, which applies the safety answer first (A.7e, A.11f-12).
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/engine/plannerEngine', '**/engine/eligibility'],
            message:
              'Use store/guardedEngine, or wrap the call with effectivePreferences(preferences, answer): health goals must not reach the engine before the safety answer allows them.',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // The engine itself, and the one boundary that hands it effectivePreferences.
      files: ['src/engine/**', 'src/store/guardedEngine.ts'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Tests drive and spy on the engine directly; the rule is for what ships.
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Reviewed exceptions. Each must pass effectivePreferences(...) to anything that reads
      // health goals; add a file here only after that review.
      files: [
        'src/components/EligibilityMeter.tsx', // wraps effectivePreferences before counting
        'src/screens/MealSwapModal.tsx', // wraps effectivePreferences before ranking
        'src/screens/recipeDetail/useRecipeDetail.ts', // wraps effectivePreferences before filtering
        'src/utils/swapCandidates.ts', // callers pass effectivePreferences
      ],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Pure helpers (appliances, store compatibility, day collection, slot labels): they
      // take no preferences, so no health goal can reach them.
      files: [
        'src/store/planSafety.ts',
        'src/store/cart.ts',
        'src/store/storeMeals.ts',
        'src/store/storePreferences.ts',
      ],
      rules: { 'no-restricted-imports': 'off' },
    },
  ],
};
