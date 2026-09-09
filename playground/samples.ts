/**
 * The documents the playground offers as input.
 *
 * Each one comes from somewhere real. The Mermaid flowchart is the unedited
 * output of the Mermaid CLI, kept in the repository as a fixture; the chart is
 * rendered here in the browser by `ml-time-graph`, which — like this library —
 * needs no DOM to produce SVG. The hand-written sample exists so there is one
 * input whose markup you can read in full while you change the knobs.
 */
import mermaidPipeline from '../examples/svg-in/mermaid-pipeline.svg?raw';
import { temperatureChart } from '../examples/shared-chart.js';

export interface Sample {
  id: string;
  label: string;
  note: string;
  svg: () => string;
}

const HAND_WRITTEN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <style>
    .box  { fill: #dbeafe; stroke: #1d4ed8; stroke-width: 2; }
    .dot  { fill: #fbbf24; stroke: #b45309; }
    .link { fill: none; stroke: #334155; stroke-width: 2; }
  </style>
  <rect class="box" x="20" y="30" width="120" height="60" rx="8"/>
  <circle class="dot" cx="250" cy="60" r="30"/>
  <path class="link" d="M140 60 C 180 60, 190 60, 220 60"/>
  <polygon class="box" points="60,180 110,120 160,180"/>
  <text x="80" y="66" font-family="sans-serif" font-size="14" fill="#1e3a8a">Kasten</text>
</svg>`;

export const SAMPLES: Sample[] = [
  {
    id: 'mermaid',
    label: 'Mermaid — die Pipeline selbst',
    note: 'Unbearbeitete Ausgabe der Mermaid-CLI — und zwar das Ablaufdiagramm von roughen(), gezeichnet von roughen(). Alle Farben stehen im eingebetteten Stylesheet, nicht an den Elementen.',
    svg: () => mermaidPipeline,
  },
  {
    id: 'timegraph',
    label: 'ml-time-graph — Zeitreihe',
    note: 'Im Browser erzeugt, ohne DOM: Daten → Diagramm → SVG → roughen(). Das Min/Max-Band und die Warnzone werden zu Schraffur — daran sieht man den Effekt, an einer blossen Linie kaum.',
    svg: () => temperatureChart(720, 360),
  },
  {
    id: 'handwritten',
    label: 'Handgeschrieben — Grundformen',
    note: 'Klein genug, um den Quelltext daneben zu lesen: rect mit rx, circle, path, polygon, und ein <text>, das unangetastet bleibt.',
    svg: () => HAND_WRITTEN,
  },
];
