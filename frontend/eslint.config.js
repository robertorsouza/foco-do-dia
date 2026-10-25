import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['node_modules/', 'coverage/', 'dist/'] },
  js.configs.recommended,
  security.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      // Índices vêm de listas fixas (turnos), não de entrada do usuário.
      'security/detect-object-injection': 'off',
    },
  },
];
