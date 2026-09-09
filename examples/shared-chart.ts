/**
 * The chart used by both `roughen-timegraph.ts` and the playground.
 *
 * Not a runnable example — a module, so the two do not drift apart.
 *
 * It is deliberately a chart with *areas*, not a single line. Sketching is a
 * treatment of surfaces as much as of strokes: a min/max band and a threshold
 * zone come back as hachure, and that is where the hand-drawn look actually
 * shows. A lone polyline only gets a slight waver.
 */
import { MLTimeGraph, SVGRenderer } from 'ml-time-graph';

interface Band {
  time: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

/**
 * A day of outside temperature: hourly mean with the spread around it.
 *
 * Computed rather than sampled, so the figure is identical on every run and a
 * regenerated book image produces no diff.
 */
function temperatureBand(): Band[] {
  const band: Band[] = [];
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
  return band;
}

/**
 * Renders the chart to an SVG string. No DOM involved, in Node or in a browser.
 *
 * The fills are kept fairly opaque on purpose. A translucent solid area reads
 * fine, but hachure covers a fraction of the same surface — carry a 40% alpha
 * over to hatching and almost nothing is left of it.
 */
export function temperatureChart(width: number = 760, height: number = 380): string {
  const chart = new MLTimeGraph({
    width,
    height,
    margin: { top: 24, right: 24, bottom: 46, left: 62 },
    axes: { left: { label: 'Grad Celsius' } },
    thresholds: [
      { name: 'warn', value: 21, color: '#dc2626', line: 'dashed', fill: 'above', label: 'Hitzewarnung' },
    ],
    series: [
      {
        name: 'Temperatur',
        showAs: 'minmaxavg',
        data: temperatureBand(),
        minColor: '#2563eb',
        maxColor: '#dc2626',
        avgColor: '#334155',
        avgDashed: true,
        fillToMax: '#fca5a5cc',
        fillToMin: '#93c5fdcc',
      },
    ],
  });
  return new SVGRenderer().render(chart.renderCommands()).content;
}
