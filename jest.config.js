const COMPONENT_TESTS = '**/?(*.)component.test.(ts|tsx)';

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
      statements: 86,
      lines: 87,
      // Floors at the level actually reached. Much of the remaining branch and function
      // surface is defensive fallbacks and theme permutations rather than user behaviour.
      functions: 86,
      branches: 65,
    },
  },
  projects: [
    {
      displayName: 'logic',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/jest.setup.js'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: sharedModuleNameMapper,
      testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/?(*.)+(spec|test).(ts|tsx|js)'],
      testPathIgnorePatterns: ['/node_modules/', '\\.component\\.test\\.(ts|tsx)$'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
    },
    {
      displayName: 'components',
      preset: 'react-native',
      setupFiles: ['<rootDir>/jest.setup.js'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.components.js'],
      moduleNameMapper: sharedModuleNameMapper,
      testMatch: [COMPONENT_TESTS],
      transformIgnorePatterns: [
        'node_modules/(?!(?:jest-)?react-native|@react-native|@testing-library|expo(nent)?|@expo(nent)?/.*|expo-.*)',
      ],
    },
  ],
};
