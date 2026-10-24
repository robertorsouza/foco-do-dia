import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: { include: ['src/**/*.js'], exclude: ['src/server.js', 'src/db/migrate.js'] },
  },
});
