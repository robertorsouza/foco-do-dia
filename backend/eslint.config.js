import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  security.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Os índices usados no projeto vêm de listas fixas validadas (turnos), não de entrada do usuário.
      'security/detect-object-injection': 'off',
    },
  },
];
