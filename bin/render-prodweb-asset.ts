/**
 * Renders the teaser image for the product page: mlcprodweb/assets/mlcrough.svg
 *
 *   npx tsx bin/render-prodweb-asset.ts     (or: task prodweb:asset)
 *
 * 800x450 to match the other cards on mlcgo.eu, on a white ground because that
 * is what the existing cards carry. Like the README figures it comes out of
 * the library itself, so the shop window cannot show something the code no
 * longer does.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mlcrough from '../src/mlcrough.js';
import { temperatureChart } from '../examples/shared-chart.js';

const WIDTH = 800;
const HEIGHT = 450;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'mlcprodweb/assets/mlcrough.svg');

const chart = temperatureChart(WIDTH, HEIGHT).replace(
  /^(\s*<svg\b[^>]*?)\s+width="100%"\s+height="100%"/,
  `$1 width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}"`,
);

const sketch = mlcrough.roughen(chart, {
  roughness: 1.3,
  bowing: 1,
  fillStyle: 'hachure',
  hachureGap: 5,
  fillWeight: 1.1,
  seed: 7,
  textBackground: { fill: '#ffffff', padding: 1.5, opacity: 0.85 },
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
});

// The card sits on a light surface; give the figure the same ground the other
// product images carry rather than letting the page show through the hachure.
const withGround = sketch.replace(/(<svg\b[^>]*>)/, '$1<rect width="100%" height="100%" fill="#ffffff"/>');

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, withGround);
console.log(`mlcprodweb/assets/mlcrough.svg  ${(withGround.length / 1024).toFixed(1)} kB`);
