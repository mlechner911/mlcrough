import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const baseConfig = {
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2017',
  logLevel: 'info',
};

const targets = [
  {
    ...baseConfig,
    entryPoints: ['src/mlcrough.ts'],
    format: 'esm',
    outfile: 'dist/mlcrough.js',
  },
  {
    // The CLI is a separate bundle: it is the only part of the package that
    // may touch Node built-ins, and keeping it out of the library entry point
    // is what lets mlcrough.js stay usable in a browser or a worker.
    ...baseConfig,
    entryPoints: ['src/cli.ts'],
    format: 'esm',
    platform: 'node',
    target: 'node18',
    outfile: 'dist/cli.js',
    banner: { js: '#!/usr/bin/env node' },
    define: { __MLCROUGH_VERSION__: JSON.stringify(pkg.version) },
  },
];

async function build() {
  const watch = process.argv.includes('--watch');
  const contexts = await Promise.all(targets.map((target) => esbuild.context(target)));

  if (watch) {
    await Promise.all(contexts.map((context) => context.watch()));
    console.log('Watching for changes...');
    return;
  }

  for (const context of contexts) {
    await context.rebuild();
    await context.dispose();
  }
  console.log('Build complete: dist/mlcrough.js, dist/cli.js');
}

build().catch(() => process.exit(1));
