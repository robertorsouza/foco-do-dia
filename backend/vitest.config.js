import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/server.js', 'src/db/migrate.js', 'src/db/pool.js', 'src/ai/clienteIA.js'],
      // A cobertura não pode cair abaixo disso (curso C2, Unidade 4.3).
      thresholds: { lines: 85, functions: 85, branches: 70, statements: 85 },
    },
  },
});
