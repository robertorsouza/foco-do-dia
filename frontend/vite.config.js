import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      include: ['src/**'],
      exclude: ['src/main.jsx'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
