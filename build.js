import * as esbuild from 'esbuild';

const baseConfig = {
  entryPoints: ['src/mlcrough.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'es2017',
  logLevel: 'info',
};

async function build() {
  // ESM (ES6) - Single library file
  await esbuild.build({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/mlcrough.js',
  });

  console.log('Build complete: dist/mlcrough.js');
}

build().catch(() => process.exit(1));
