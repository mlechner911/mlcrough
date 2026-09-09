/**
 * Renders the figures shown in README.md.
 *
 *   npx tsx bin/render-readme-images.ts     (or: task images)
 *
 * The figures are generated rather than hand-placed, so they cannot drift away
 * from the library: every one of them is produced by the same code path the
 * examples use. Re-run this after changing a filler, the cascade resolver or
 * the example options, and the README follows.
 *
 * No browser is involved. The pipeline already ends in SVG, and SVG is what
 * GitHub and npm both display — so there is nothing to rasterize.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mlcrough from '../src/mlcrough.js';
import { temperatureChart } from '../examples/shared-chart.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/images');
fs.mkdirSync(outDir, { recursive: true });

/**
 * Gives a document an intrinsic size.
 *
 * ml-time-graph emits `width="100%" height="100%"` and no viewBox, which is
 * right for something mounted in a page that decides the size — but a file
 * shown through <img> has no container to ask, so the browser cannot work out
 * an aspect ratio and the chart collapses. Pinning the box makes it a picture.
 */
function pinViewport(svg: string, width: number, height: number): string {
  return svg.replace(
    /^(\s*<svg\b[^>]*?)\s+width="100%"\s+height="100%"/,
    `$1 width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
  );
}

function write(name: string, svg: string): void {
  fs.writeFileSync(path.join(outDir, name), svg);
  console.log(`${name}  ${(svg.length / 1024).toFixed(1)} kB`);
}

// 1. Mermaid — the unedited CLI output, and the same document sketched.
//    The diagram is roughen()'s own pipeline, so the figure explaining the
//    transform is produced by the transform.
const mermaid = fs.readFileSync(path.join(root, 'examples/svg-in/mermaid-pipeline.svg'), 'utf8');
write('pipeline-original.svg', mermaid);
write('pipeline-rough.svg', mlcrough.roughen(mermaid, {
  roughness: 1.4,
  bowing: 1.5,
  fillStyle: 'hachure',
  hachureGap: 9,
  seed: 42,
  // The node labels sit directly on the hachure; a plate keeps them legible.
  textBackground: true,
}));

// 2. ml-time-graph — rendered here, sketched here, no file in between.
const CHART_WIDTH = 760;
const CHART_HEIGHT = 380;
const chart = pinViewport(temperatureChart(CHART_WIDTH, CHART_HEIGHT), CHART_WIDTH, CHART_HEIGHT);
write('chart-original.svg', chart);
write('chart-rough.svg', mlcrough.roughen(chart, {
  roughness: 1.3,
  bowing: 1,
  fillStyle: 'hachure',
  hachureGap: 5,
  fillWeight: 1.1,
  seed: 7,
  textBackground: { fill: '#ffffff', padding: 1.5, opacity: 0.85 },
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
}));
