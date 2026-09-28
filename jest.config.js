const COMPONENT_TESTS = '**/?(*.)component.test.(ts|tsx)';

/**
 * One transform for both projects, so both instrument every file identically.
 *
 * `preserveEnvVars` stops babel-preset-expo from baking `.env` values into the compiled code:
 * config/env.ts is tested by setting process.env at run time, which is too late once
 * EXPO_PUBLIC_PORT has already been replaced by the literal 8081.
 */
const sharedTransform = {
  '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', { caller: { name: 'jest', preserveEnvVars: true } }],
};

const sharedModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
};

/**
 * Two projects on purpose: engine, store and data tests run fast in plain Node, while
 * component tests need React Native's own resolver for its platform-specific modules.
 */
module.exports = {
  collectCoverageFrom: [
    '{src,config}/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!src/types/**',
    '!**/*.d.ts',
  ],
  // The project's own bar. Branch coverage sits lower because much of it is defensive
  // fallbacks and theme permutations; statements and lines are the meaningful floor here.
  coverageThreshold: {
    global: {
      statements: 87,
      lines: 88,
      // Floors at the level actually reached. Much of the remaining branch and function
      // surface is defensive fallbacks and theme permutations rather than user behaviour.
      functions: 87,
      branches: 76,
    },
  },
  projects: [
    {
      displayName: 'logic',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.setup.js'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: sharedModuleNameMapper,
      testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/?(*.)+(spec|test).(ts|tsx|js)'],
      // supabase/functions runs on Deno and has its own tests: `deno test supabase/functions`.
      testPathIgnorePatterns: ['/node_modules/', '\\.component\\.test\\.(ts|tsx)$', '/supabase/'],
      // Babel, the same transformer the components project uses. Both projects load the
      // engine and the store, and coverage merges the two instrumentations of each file.
      // With ts-jest here the two maps counted different statements for the same file
      // (plannerEngine: 665 vs 793), and whichever worker finished first set the map the
      // other's hits were folded into — the same suite reported 87.5% or 82.7% at random.
      // Types are still checked, by `npm run typecheck`, which runs before every upload.
      transform: sharedTransform,
    },
    {
      displayName: 'components',
      preset: 'react-native',
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.components.js'],
      moduleNameMapper: sharedModuleNameMapper,
      transform: sharedTransform,
      testMatch: [COMPONENT_TESTS],
      transformIgnorePatterns: [
        'node_modules/(?!(?:jest-)?react-native|@react-native|@testing-library|expo(nent)?|@expo(nent)?/.*|expo-.*)',
      ],
    },
  ],
};
