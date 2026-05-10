import * as esbuild from 'esbuild';

const baseConfig = {
  entryPoints: ['src/rough.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2017',
  logLevel: 'info',
};

async function build() {
  // 1. IIFE (for browsers)
  await esbuild.build({
    ...baseConfig,
    format: 'iife',
    globalName: 'rough',
    outfile: 'bundled/rough.js',
    footer: {
      // rough.js usually exports default, we need to expose it for IIFE
      js: 'if (typeof rough !== "undefined" && rough.default) { rough = rough.default; }',
    },
  });

  // 2. ESM
  await esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: 'bundled/rough.esm.js',
  });

  // 3. CJS
  await esbuild.build({
    ...baseConfig,
    format: 'cjs',
    outfile: 'bundled/rough.cjs.js',
  });

  console.log('Build complete!');
}

build().catch(() => process.exit(1));
