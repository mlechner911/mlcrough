/**
 * A real chart, drawn twice: once precisely, once by hand.
 *
 * Unlike the Mermaid example this one has no input file. `ml-time-graph`
 * renders the chart here, in this process, and the SVG goes straight into
 * `roughen()` — no browser, no headless Chrome, no temporary file anywhere in
 * the chain. Both libraries are DOM-free, so the whole pipeline is a function
 * call:
 *
 *     data → MLTimeGraph → SVG → roughen() → SVG
 *
 * That is the case sketching is actually for: a chart that is accurate but
 * pointedly provisional. A hand-drawn min/max band reads as "this is the
 * range we measured, not a promise" in a way no caption achieves.
 *
 *   npm run example:roughen-timegraph > test-output/roughen-timegraph.svg
 *
 * Note what is *not* sketched: the tick labels, the axis title and the
 * threshold label stay exactly where the chart put them, because roughen()
 * never touches <text>.
 */
import mlcrough from '../src/mlcrough.js';
import { temperatureChart } from './shared-chart.js';

process.stdout.write(mlcrough.roughen(temperatureChart(), {
  roughness: 1.3,
  bowing: 1,
  fillStyle: 'hachure',
  // Hachure over a wide band gets sparse; tighten the lines and give them a
  // little more weight than the stroke width would imply.
  hachureGap: 5,
  fillWeight: 1.1,
  seed: 7,
  // Tick labels and the threshold caption cross the hachured band.
  textBackground: { fill: '#ffffff', padding: 1.5, opacity: 0.85 },

  /**
   * Not every shape wants the same hand.
   *
   * `bowing` is proportional to the length of a line, so the value that gives
   * the data curve a pleasant waver bends the 320px axis into a visible arc.
   * The axes, ticks and the threshold marker are the <line> elements, the
   * series and its fills are <path>s — so telling them apart costs one
   * comparison, and the chart keeps a straight frame around a hand-drawn
   * interior, which is what makes it readable.
   */
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
}));
