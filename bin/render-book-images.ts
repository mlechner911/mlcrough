/**
 * Renders the figures of the handbook under book/images/.
 *
 *   npx tsx bin/render-book-images.ts       (or: task book:images)
 *
 * Every figure is produced by the library it documents. A manual whose
 * pictures are pasted in drifts away from the code within one release; one
 * whose pictures are generated cannot.
 *
 * Two files per figure, because mlcgo.eu is dark by default and light on
 * request. The unsuffixed name carries the dark version — a chapter that only
 * knows the plain name therefore already shows the right thing — and
 * `<name>.light.svg` the other. Neither carries a background: the page
 * supplies it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mlcrough from '../src/mlcrough.js';
import { Options } from '../src/core.js';
import { MLTimeGraph, SVGRenderer } from 'ml-time-graph';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'book/images');
fs.mkdirSync(outDir, { recursive: true });

/** Ink that reads on the ground it is drawn on. */
interface Theme {
  ink: string;
  muted: string;
  paper: string;
}

const DARK: Theme = { ink: '#e2e8f0', muted: '#8ba3c0', paper: '#0a0f1e' };
const LIGHT: Theme = { ink: '#1f2937', muted: '#64748b', paper: '#ffffff' };

function write(name: string, theme: 'dark' | 'light', svg: string): void {
  const file = theme === 'dark' ? `${name}.svg` : `${name}.light.svg`;
  fs.writeFileSync(path.join(outDir, file), svg);
  console.log(`${file.padEnd(28)} ${(svg.length / 1024).toFixed(1)} kB`);
}

/** Wraps drawn markup in a document of a known size. */
function doc(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

const rc = mlcrough.svgString();
const draw = (node: ReturnType<typeof rc.rectangle>): string => mlcrough.serialize(node);

// ── 1. The generator API: shapes described, not read ────────────────────────

function shapes(t: Theme): string {
  const base: Options = { stroke: t.ink, strokeWidth: 2, seed: 11, roughness: 1.3 };
  const label = (x: number, text: string): string =>
    `<text x="${x}" y="188" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${t.muted}">${text}</text>`;
  return doc(720, 200, [
    draw(rc.rectangle(30, 30, 140, 110, { ...base, fill: '#7c3aed', fillStyle: 'hachure' })),
    draw(rc.circle(275, 85, 115, { ...base, fill: '#0891b2', fillStyle: 'cross-hatch' })),
    draw(rc.polygon([[400, 140], [470, 30], [540, 140]], { ...base, fill: '#f97316', fillStyle: 'zigzag' })),
    draw(rc.path('M590 130 C 610 40, 660 40, 690 130', { ...base, fill: undefined })),
    label(100, 'rectangle'), label(275, 'circle'), label(470, 'polygon'), label(640, 'path'),
  ].join(''));
}

// ── 2. What roughness does ──────────────────────────────────────────────────

function roughnessScale(t: Theme): string {
  const parts: string[] = [];
  [0, 0.5, 1, 2, 3].forEach((roughness, i) => {
    const x = 20 + i * 140;
    parts.push(draw(rc.rectangle(x, 25, 110, 90, {
      stroke: t.ink, strokeWidth: 2, seed: 5, roughness,
      fill: '#7c3aed', fillStyle: 'hachure', hachureGap: 6,
    })));
    parts.push(`<text x="${x + 55}" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="${t.muted}">roughness ${roughness}</text>`);
  });
  return doc(720, 155, parts.join(''));
}

// ── 3. Every fill style, same shape ─────────────────────────────────────────

const FILL_STYLES = [
  'hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'dashed',
  'zigzag-line', 'multi-hachure', 'multi-dots', 'gradient', 'radial-gradient',
] as const;

function fillGallery(t: Theme): string {
  const cols = 4;
  const cellW = 180;
  const cellH = 130;
  const parts: string[] = [];
  FILL_STYLES.forEach((fillStyle, i) => {
    const x = (i % cols) * cellW + 20;
    const y = Math.floor(i / cols) * cellH + 20;
    parts.push(draw(rc.rectangle(x, y, 140, 80, {
      stroke: t.ink, strokeWidth: 1.5, seed: 3 + i, roughness: 1,
      // 12 rather than the tighter gap the other figures use: `dots` and
      // `multi-dots` draw a sketched ellipse per dot, and at gap 6 this one
      // figure alone came to 600 kB.
      fill: '#0891b2', fillStyle, hachureGap: 12,
    })));
    parts.push(`<text x="${x + 70}" y="${y + 100}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${t.muted}">${fillStyle}</text>`);
  });
  return doc(cols * cellW + 40, Math.ceil(FILL_STYLES.length / cols) * cellH + 30, parts.join(''));
}

// ── 4. A chart, before and after ────────────────────────────────────────────

function chart(t: Theme): string {
  const band: { time: number; min: number; max: number; avg: number; count: number }[] = [];
  for (let hour = 0; hour <= 24; hour++) {
    const avg = 16 - 6 * Math.cos((hour / 24) * 2 * Math.PI) + 0.7 * Math.sin(hour * 1.7);
    const spread = 1.6 + 0.9 * Math.sin(hour * 0.9);
    band.push({
      time: Date.UTC(2026, 5, 21, hour),
      min: Number((avg - spread).toFixed(2)),
      max: Number((avg + spread).toFixed(2)),
      avg: Number(avg.toFixed(2)),
      count: 60,
    });
  }
  const graph = new MLTimeGraph({
    width: 760,
    height: 360,
    margin: { top: 20, right: 24, bottom: 44, left: 62 },
    axes: { left: { label: 'Grad Celsius', labels: { color: t.muted }, axis: { color: t.muted } } },
    thresholds: [{ name: 'warn', value: 21, color: '#dc2626', line: 'dashed', fill: 'above', label: 'Hitzewarnung' }],
    series: [{
      name: 'Temperatur',
      showAs: 'minmaxavg',
      data: band,
      minColor: '#3b82f6', maxColor: '#ef4444', avgColor: t.ink,
      avgDashed: true,
      fillToMax: '#fca5a5cc', fillToMin: '#93c5fdcc',
    }],
  });
  return new SVGRenderer().render(graph.renderCommands()).content.replace(
    /^(\s*<svg\b[^>]*?)\s+width="100%"\s+height="100%"/,
    '$1 width="760" height="360" viewBox="0 0 760 360"',
  );
}

const CHART_SKETCH: Parameters<typeof mlcrough.roughen>[1] = {
  roughness: 1.3, bowing: 1, fillStyle: 'hachure', hachureGap: 5, fillWeight: 1.1, seed: 7,
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
};

// ── 5. The pipeline diagram, from Mermaid, in both themes ───────────────────

const PIPELINE_SKETCH: Parameters<typeof mlcrough.roughen>[1] = {
  roughness: 1.4, bowing: 1.5, fillStyle: 'hachure', hachureGap: 9, seed: 42, textBackground: false,
};

/** Mermaid bakes its theme into the document, so each ground needs its own render. */
function pipelineSource(theme: 'dark' | 'light'): string {
  const file = theme === 'dark' ? 'mermaid-pipeline.dark.svg' : 'mermaid-pipeline.svg';
  return fs.readFileSync(path.join(root, 'examples/svg-in', file), 'utf8')
    // The light render carries an opaque white ground; the page provides one.
    .replace(/background-color:\s*white;?/, '');
}

for (const [name, theme] of [['dark', DARK], ['light', LIGHT]] as const) {
  write('shapes', name, shapes(theme));
  write('roughness', name, roughnessScale(theme));
  write('fills', name, fillGallery(theme));

  const c = chart(theme);
  write('chart', name, c);
  write('chart_rough', name, mlcrough.roughen(c, {
    ...CHART_SKETCH,
    textBackground: { fill: theme.paper, padding: 1.5, opacity: 0.8 },
  }));

  const p = pipelineSource(name);
  write('pipeline', name, p);
  write('pipeline_rough', name, mlcrough.roughen(p, {
    ...PIPELINE_SKETCH,
    textBackground: { fill: theme.paper, padding: 1, opacity: 0.75 },
  }));
}
