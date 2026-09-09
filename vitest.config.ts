import { defineConfig } from 'vitest/config';

// A config of its own, because vite.config.ts sets `root: 'playground'` for
// the dev server — which would leave the test runner looking in the wrong
// directory.
export default defineConfig({
  test: {
    root: '.',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
