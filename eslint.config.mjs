import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Base ESLint recommended rules
  eslint.configs.recommended,
  
  // TypeScript configuration
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Include TypeScript recommended rules
      ...tseslint.configs.recommended.rules,
    },
  },
  
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];