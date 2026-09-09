/**
 * The development playground: `npm run dev`.
 *
 * It imports the library from `src/`, not from `dist/`, so a change to a
 * filler or to the cascade resolver is visible on the next save without a
 * build step. That is the whole reason it exists — the published package is
 * exercised by the examples and the CLI instead.
 */
import mlcrough from '../src/mlcrough.js';
import { FillStyle } from '../src/core.js';
import { SAMPLES, Sample } from './samples.js';

const FILL_STYLES: FillStyle[] = [
  'hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'dashed',
  'zigzag-line', 'multi-hachure', 'multi-dots', 'gradient', 'radial-gradient',
];

/** Every slider, with the option it feeds. */
const SLIDERS = [
  'roughness', 'bowing', 'strokeWidth', 'hachureGap', 'hachureAngle', 'fillWeight',
  'padding', 'seed',
] as const;
type SliderName = (typeof SLIDERS)[number];

const el = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const sampleSelect = el<HTMLSelectElement>('sample');
const textBg = el<HTMLInputElement>('textBg');
const textBgColor = el<HTMLInputElement>('textBgColor');
const fillStyleSelect = el<HTMLSelectElement>('fillStyle');
const stageIn = el<HTMLDivElement>('stage-in');
const stageOut = el<HTMLDivElement>('stage-out');
const sizeIn = el<HTMLSpanElement>('size-in');
const sizeOut = el<HTMLSpanElement>('size-out');
const note = el<HTMLParagraphElement>('note');

/** The document currently loaded, and where it came from. */
let source = '';
let sourceNote = '';
let lastResult = '';

function fillSelects(): void {
  for (const sample of SAMPLES) {
    sampleSelect.append(new Option(sample.label, sample.id));
  }
  sampleSelect.append(new Option('— eigene Datei —', 'custom'));
  for (const style of FILL_STYLES) {
    fillStyleSelect.append(new Option(style, style));
  }
}

function sliderValue(name: SliderName): number {
  return Number(el<HTMLInputElement>(name).value);
}

/** Reads the controls into the options object roughen() takes. */
function currentOptions(): Parameters<typeof mlcrough.roughen>[1] {
  const strokeWidth = sliderValue('strokeWidth');
  const hachureGap = sliderValue('hachureGap');
  const fillWeight = sliderValue('fillWeight');
  return {
    roughness: sliderValue('roughness'),
    bowing: sliderValue('bowing'),
    fillStyle: fillStyleSelect.value as FillStyle,
    hachureAngle: sliderValue('hachureAngle'),
    // -1 is the library's "work it out from the stroke width" default, and 0
    // would be a gap of nothing — so anything below 1 means "leave it alone".
    ...(hachureGap >= 1 ? { hachureGap } : {}),
    // 0 means "keep whatever the source element says".
    ...(strokeWidth > 0 ? { strokeWidth } : {}),
    // -1 is the library's own default: derive the hachure weight from the
    // stroke width. Anything above 0 overrides it.
    ...(fillWeight > 0 ? { fillWeight } : {}),
    padding: sliderValue('padding'),
    seed: sliderValue('seed'),
    ...(textBg.checked ? { textBackground: textBgColor.value } : {}),
  };
}

function formatBytes(text: string): string {
  return `${(new TextEncoder().encode(text).length / 1024).toFixed(1)} kB`;
}

function render(): void {
  for (const name of SLIDERS) {
    el<HTMLOutputElement>(`${name}-out`).textContent = el<HTMLInputElement>(name).value;
  }
  note.textContent = sourceNote;
  stageIn.innerHTML = source;
  sizeIn.textContent = formatBytes(source);

  try {
    const started = performance.now();
    lastResult = mlcrough.roughen(source, currentOptions());
    const took = performance.now() - started;
    stageOut.innerHTML = lastResult;
    sizeOut.textContent = `${formatBytes(lastResult)} · ${took.toFixed(0)} ms`;
  } catch (error) {
    lastResult = '';
    stageOut.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'error';
    box.textContent = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    stageOut.append(box);
    sizeOut.textContent = 'Fehler';
  }
}

function loadSample(sample: Sample): void {
  source = sample.svg();
  sourceNote = sample.note;
  sampleSelect.value = sample.id;
  render();
}

/** The sample named in the URL hash, so a state can be linked to. */
function sampleFromHash(): Sample {
  const id = location.hash.replace(/^#/, '');
  return SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
}

function loadFile(file: File): void {
  file.text().then((text) => {
    source = text;
    sourceNote = `${file.name} — ${formatBytes(text)}`;
    if (!sampleSelect.querySelector('option[value=custom]:checked')) sampleSelect.value = 'custom';
    render();
  });
}

function wire(): void {
  sampleSelect.addEventListener('change', () => {
    const sample = SAMPLES.find((s) => s.id === sampleSelect.value);
    if (sample) {
      location.hash = sample.id;
      loadSample(sample);
    }
  });
  window.addEventListener('hashchange', () => loadSample(sampleFromHash()));
  fillStyleSelect.addEventListener('change', render);
  textBg.addEventListener('change', render);
  textBgColor.addEventListener('input', () => {
    if (!textBg.checked) textBg.checked = true;
    render();
  });
  for (const name of SLIDERS) {
    el<HTMLInputElement>(name).addEventListener('input', render);
  }

  el<HTMLButtonElement>('reseed').addEventListener('click', () => {
    const seed = el<HTMLInputElement>('seed');
    seed.value = String(1 + Math.floor(Math.random() * 200));
    render();
  });

  el<HTMLButtonElement>('download').addEventListener('click', () => {
    if (!lastResult) return;
    const url = URL.createObjectURL(new Blob([lastResult], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sampleSelect.value}-rough.svg`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Dropping a file anywhere on the page loads it.
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
    document.body.classList.add('drop');
  });
  document.addEventListener('dragleave', () => document.body.classList.remove('drop'));
  document.addEventListener('drop', (event) => {
    event.preventDefault();
    document.body.classList.remove('drop');
    const file = event.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  });
}

fillSelects();
wire();
loadSample(sampleFromHash());
