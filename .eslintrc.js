module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react/react-in-jsx-scope': 'off',
  },
  overrides: [
    {
      // CommonJS config files and the jest setup run in Node, not the bundle
      files: [
        '*.config.js',
        '.eslintrc.js',
        'jest.setup.js',
        'babel.config.js',
      ],
      env: { node: true, jest: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Tests use require() for jest.resetModules()-based module reloading
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
