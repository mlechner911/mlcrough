import { defineConfig } from 'vite';

// The playground is a development tool, not a build target: it loads the
// library straight from `src/` so a change is visible without a build step.
export default defineConfig({
  root: 'playground',
  server: {
    port: 3000,
    open: true,
    fs: {
      // The playground reads sample documents from examples/svg-in/, which
      // sits above its own root.
      allow: ['..'],
    },
  },
  build: {
    outDir: '../dist-playground',
    emptyOutDir: true,
  },
});
