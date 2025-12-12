module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['react-native/jest/setup.js', '<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    // Support pnpm's nested `.pnpm/.../node_modules/<pkg>` layout.
    // We still want to transform RN-related packages that ship untranspiled JS/Flow.
    'node_modules/(?!(\\.pnpm|react-native|@react-native|@react-navigation|@rneui|react-native-.*)/)',
    'node_modules/\\.pnpm/(?!(react-native[^/]*|@react-native\\+[^/]*|@react-navigation\\+[^/]*|@rneui\\+[^/]*|react-native-[^/]*)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@locales/(.*)$': '<rootDir>/src/locales/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/*.test.(ts|tsx|js)',
  ],
};

