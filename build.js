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
  const watch = process.argv.includes('--watch');

  const context = await esbuild.context({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/mlcrough.js',
  });

  if (watch) {
    await context.watch();
    console.log('Watching for changes...');
  } else {
    await context.rebuild();
    await context.dispose();
    console.log('Build complete: dist/mlcrough.js');
  }
}

build().catch(() => process.exit(1));
