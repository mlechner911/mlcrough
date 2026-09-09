// roughen() — take an SVG someone else produced, hand back the same drawing
// as if it had been sketched by hand.
//
// This is the counterpart to the generator API. Instead of asking the caller
// to describe a shape, it reads shapes out of a finished document: Mermaid,
// D3, Graphviz, a charting library, anything that emits SVG. Each
// rect/circle/ellipse/line/polyline/polygon/path is replaced in place by a
// group of hand-drawn paths carrying the same computed paint; everything else
// — text, markers, gradients, the XML around it — is passed through untouched.
//
// Replacing *in place* is what keeps this simple: the replacement sits at the
// same position in the tree as the element it stands in for, so every group
// transform above it still applies and no coordinate has to be re-projected.
// Only a transform on the shape element itself has to be carried over, and it
// moves to the wrapping group.

import { Options, SVGNode } from './core';
import { Point } from './geometry';
import { MLCRoughSVG, StringRenderer, serializeSVG } from './svg';
import { CssRule, StyledElement, cascade, parseInlineStyle, parseStylesheet } from './css';
import { XmlElement, XmlNode, openTag, parseXml, serializeXml } from './xml';

/** The shape elements roughen() knows how to redraw. */
const SHAPES = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path']);

/**
 * Subtrees that are passed through whole.
 *
 * Everything in here is referenced by something else rather than drawn where
 * it stands — an arrowhead, a gradient, a clip path. Sketching those would
 * change what the reference resolves to, usually for the worse: a hand-drawn
 * arrowhead is redrawn at every marker position, a roughened clip path stops
 * clipping cleanly.
 */
const OPAQUE_SUBTREES = new Set([
  'defs', 'clipPath', 'mask', 'marker', 'pattern', 'symbol',
  'text', 'foreignObject', 'style', 'script', 'metadata', 'title', 'desc',
]);

/** Presentation attributes that take part in the cascade. */
const PRESENTATION = [
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset',
  'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility', 'color',
  'font-size', 'text-anchor',
];

/** Properties that children inherit. `opacity` and `display` deliberately do not. */
const INHERITED = [
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset',
  'fill-opacity', 'stroke-opacity', 'visibility', 'color',
  'font-size', 'text-anchor',
];

/** How the plate behind a label is drawn. See `RoughenOptions.textBackground`. */
export interface TextBackground {
  /** Colour of the plate. Defaults to white. */
  fill?: string;
  /** Space around the label, in user units. Defaults to 2. */
  padding?: number;
  /** Corner radius. Defaults to 0. */
  rx?: number;
  /** Opacity of the plate, 0 to 1. Defaults to fully opaque. */
  opacity?: number;
}

/** What roughen() knows about a shape when it asks the caller about it. */
export interface ShapeInfo {
  /** Tag name of the source element, e.g. `rect`. */
  tag: string;
  /** Attributes of the source element. */
  attrs: Record<string, string>;
  /** Computed presentation properties after the cascade. */
  style: Record<string, string>;
  /** Running index of this shape in the document, from 0. */
  index: number;
}

export interface RoughenOptions extends Options {
  /**
   * Called for every shape before it is redrawn. Return extra options to
   * merge in for this shape only, or `false` to pass the element through
   * unchanged.
   */
  onShape?: (shape: ShapeInfo) => Options | false | undefined | void;
  /**
   * Redraw shapes inside `<defs>`, `<marker>`, `<clipPath>` and friends too.
   * Off by default — see OPAQUE_SUBTREES.
   */
  includeDefs?: boolean;
  /**
   * Lay a plate of colour behind every label, so text stays readable where a
   * hachure fill runs underneath it.
   *
   * A colour string is shorthand for `{ fill: colour }`, `true` for a white
   * plate. Off by default.
   */
  textBackground?: boolean | string | TextBackground;
  /**
   * User units to add around the root `viewBox`.
   *
   * A sketched line wanders a little outside the shape it stands for, and
   * generated documents are usually cropped exactly to their content — so
   * without this, the outermost strokes are cut off by the viewport edge.
   * Defaults to `2 + 2 * roughness`; set 0 to keep the viewBox as it is.
   */
  padding?: number;
}

/** Reads a length attribute, returning `fallback` for missing or relative values. */
function length(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  if (value.includes('%')) return NaN; // relative to the viewport — not resolvable here
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parses an SVG `points` list into point pairs. */
function parsePoints(value: string | undefined): Point[] {
  if (!value) return [];
  const numbers = value.trim().split(/[\s,]+/).map(parseFloat).filter((n) => Number.isFinite(n));
  const points: Point[] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
  return points;
}

/** A value that means "no paint". */
function isNone(value: string | undefined): boolean {
  return !value || value === 'none' || value === 'transparent';
}

/** Drops CSS-wide keywords we cannot act on, so the inherited value wins. */
function usable(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const v = value.trim();
  if (!v || v === 'inherit' || v === 'initial' || v === 'unset' || v === 'revert') return undefined;
  return v;
}

/** Resolves `currentColor` against the computed `color` property. */
function paint(value: string | undefined, style: Record<string, string>): string | undefined {
  const v = usable(value);
  if (v === undefined) return undefined;
  if (v.toLowerCase() === 'currentcolor') return usable(style['color']) || '#000';
  return v;
}

/** Derives a stable per-shape seed, so repeated runs produce identical output. */
function seedFor(base: number, index: number): number {
  if (!base) return 0; // caller asked for a fresh random look on every run
  const mixed = (Math.imul(base ^ (index + 1), 2654435761) >>> 0) % 2147483647;
  return mixed || 1;
}

/** Builds the path data for a rounded rectangle. */
function roundedRectPath(x: number, y: number, w: number, h: number, rx: number, ry: number): string {
  const cx = Math.min(rx, w / 2);
  const cy = Math.min(ry, h / 2);
  return [
    `M${x + cx},${y}`,
    `H${x + w - cx}`,
    `A${cx},${cy} 0 0 1 ${x + w},${y + cy}`,
    `V${y + h - cy}`,
    `A${cx},${cy} 0 0 1 ${x + w - cx},${y + h}`,
    `H${x + cx}`,
    `A${cx},${cy} 0 0 1 ${x},${y + h - cy}`,
    `V${y + cy}`,
    `A${cx},${cy} 0 0 1 ${x + cx},${y}`,
    'Z',
  ].join(' ');
}

/**
 * Redraws every shape in an SVG document in a hand-drawn style.
 *
 * @param svg The source SVG document.
 * @param options Drawing options, plus `onShape` / `includeDefs`.
 * @returns The document with its shapes replaced, everything else untouched.
 */
export function roughen(svg: string, options?: RoughenOptions): string {
  const settings: RoughenOptions = { seed: 1, ...(options || {}) };
  const { onShape, includeDefs, padding, textBackground, ...drawOptions } = settings;
  const plate = resolveTextBackground(textBackground);
  const baseSeed = drawOptions.seed ?? 1;
  const pad = padding ?? (2 + 2 * (drawOptions.roughness ?? 1));

  const tree = parseXml(svg);
  const rules = collectStyles(tree);
  const rc = new MLCRoughSVG<SVGNode>(new StringRenderer(), { options: drawOptions });

  let index = 0;

  const walk = (nodes: XmlNode[], ancestors: StyledElement[], inherited: Record<string, string>): void => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type !== 'element') continue;

      if (!includeDefs && OPAQUE_SUBTREES.has(node.tag)) {
        if (plate && (node.tag === 'text' || node.tag === 'foreignObject')) {
          const labelStyle = computeStyle(node, [...ancestors, node], rules, inherited);
          const backdrop = textPlate(node, labelStyle, plate);
          if (backdrop) {
            nodes.splice(i, 0, { type: 'raw', text: backdrop });
            i++;
          }
        }
        continue;
      }

      const stack = [...ancestors, node];
      const style = computeStyle(node, stack, rules, inherited);

      if (SHAPES.has(node.tag)) {
        const shape: ShapeInfo = { tag: node.tag, attrs: node.attrs, style, index };
        const extra = onShape ? onShape(shape) : undefined;
        if (extra === false) continue;
        const replacement = redraw(rc, node, style, { ...(extra || {}), seed: seedFor(baseSeed, index) });
        if (replacement) {
          nodes[i] = { type: 'raw', text: replacement };
          index++;
        }
        continue;
      }

      const passDown: Record<string, string> = {};
      for (const prop of INHERITED) {
        if (style[prop] !== undefined) passDown[prop] = style[prop];
      }
      walk(node.children, stack, passDown);
    }
  };

  walk(tree, [], {});
  if (pad > 0) {
    for (const node of tree) {
      if (node.type === 'element' && node.tag === 'svg') { padViewport(node, pad); break; }
    }
  }
  return serializeXml(tree);
}

/**
 * Grows the root viewport so sketched strokes are not clipped by its edge.
 *
 * The opening tag is edited in place rather than rebuilt, so every other
 * attribute keeps its original spelling and order.
 */
function padViewport(svg: XmlElement, pad: number): void {
  const viewBox = svg.attrs['viewBox'];
  let next: string | null = null;
  if (viewBox) {
    const n = viewBox.trim().split(/[\s,]+/).map(parseFloat);
    if (n.length === 4 && n.every(Number.isFinite)) {
      next = `${n[0] - pad} ${n[1] - pad} ${n[2] + 2 * pad} ${n[3] + 2 * pad}`;
    }
  } else {
    const w = length(svg.attrs['width'], NaN);
    const h = length(svg.attrs['height'], NaN);
    if (w > 0 && h > 0) next = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`;
  }
  if (next === null) return;

  if (viewBox) {
    svg.open = svg.open.replace(/(\sviewBox\s*=\s*)(["'])[^"']*\2/, (_m, lead, quote) => `${lead}${quote}${next}${quote}`);
  } else {
    svg.open = svg.open.replace(/\s*\/?>$/, (tail) => ` viewBox="${next}"${tail.trimStart()}`);
  }
  svg.attrs['viewBox'] = next;

  // Absolute width/height must grow with the box, or the drawing is squeezed.
  for (const dim of ['width', 'height']) {
    const raw = svg.attrs[dim];
    if (!raw || /[%a-z]/i.test(raw)) continue;
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) continue;
    const grown = String(value + 2 * pad);
    svg.open = svg.open.replace(new RegExp(`(\\s${dim}\\s*=\\s*)(["'])[^"']*\\2`), (_m, lead, quote) => `${lead}${quote}${grown}${quote}`);
    svg.attrs[dim] = grown;
  }
}

/** Gathers every `<style>` element in the document into one rule list. */
function collectStyles(nodes: XmlNode[]): CssRule[] {
  const rules: CssRule[] = [];
  const visit = (list: XmlNode[]): void => {
    for (const node of list) {
      if (node.type !== 'element') continue;
      if (node.tag === 'style') {
        const text = node.children.map((c) => (c.type === 'raw' ? c.text : '')).join('');
        rules.push(...parseStylesheet(text, rules.length));
        continue;
      }
      visit(node.children);
    }
  };
  visit(nodes);
  return rules;
}

/** Applies the cascade for one element: inherited → attributes → CSS → inline. */
function computeStyle(
  el: XmlElement,
  stack: StyledElement[],
  rules: CssRule[],
  inherited: Record<string, string>,
): Record<string, string> {
  const style: Record<string, string> = { ...inherited };
  for (const prop of PRESENTATION) {
    const value = usable(el.attrs[prop]);
    if (value !== undefined) style[prop] = value;
  }
  for (const [prop, value] of Object.entries(cascade(rules, stack))) {
    const v = usable(value);
    if (v !== undefined) style[prop] = v;
  }
  if (el.attrs['style']) {
    for (const [prop, value] of Object.entries(parseInlineStyle(el.attrs['style']))) {
      const v = usable(value);
      if (v !== undefined) style[prop] = v;
    }
  }
  return style;
}

/**
 * Redraws one shape element, or returns null to leave it alone.
 *
 * Returns null for anything that would not be visible anyway (hidden, zero
 * sized, no paint at all) and for geometry this cannot express in absolute
 * user units, such as a width given in percent.
 */
function redraw(
  rc: MLCRoughSVG<SVGNode>,
  el: XmlElement,
  style: Record<string, string>,
  extra: Options,
): string | null {
  if (style['display'] === 'none' || style['visibility'] === 'hidden') return null;

  const fill = paint(style['fill'], style) ?? '#000'; // SVG initial fill is black
  const stroke = paint(style['stroke'], style) ?? 'none';
  const strokeWidth = length(usable(style['stroke-width']), 1);
  const hasStroke = !isNone(stroke) && strokeWidth > 0;
  const hasFill = !isNone(fill);
  if (!hasStroke && !hasFill) return null;

  const shapeOptions: Options = {
    ...extra,
    stroke: hasStroke ? stroke : 'none',
    // `stroke: 'none'` already suppresses the outline, so the width is free to
    // stay. It has to: a hachure line takes its weight from `fillWeight`,
    // which defaults to strokeWidth / 2 — zero it here and every filled shape
    // that carries no stroke of its own is drawn in lines of width 0, i.e.
    // vanishes. Chart libraries emit exactly that for their fill areas.
    strokeWidth: hasStroke ? strokeWidth : Math.max(strokeWidth, 1),
  };
  if (hasFill) {
    shapeOptions.fill = fill;
    // A gradient or pattern reference can only be painted as one solid area.
    if (fill.startsWith('url(')) shapeOptions.fillStyle = 'solid';
  }
  const dash = usable(style['stroke-dasharray']);
  if (dash && dash !== 'none') {
    const pattern = dash.split(/[\s,]+/).map(parseFloat).filter((n) => Number.isFinite(n));
    if (pattern.length && pattern.some((n) => n > 0)) shapeOptions.strokeLineDash = pattern;
  }

  const group = draw(rc, el, shapeOptions);
  if (!group || !group.children.length) return null;

  carryMarkers(group, el);

  const wrapper: Record<string, string> = {};
  if (el.attrs['id']) wrapper['id'] = el.attrs['id'];
  if (el.attrs['transform']) wrapper['transform'] = el.attrs['transform'];
  for (const prop of ['opacity', 'fill-opacity', 'stroke-opacity']) {
    const value = usable(style[prop]);
    if (value !== undefined && value !== '1') wrapper[prop] = value;
  }
  if (el.attrs['clip-path']) wrapper['clip-path'] = el.attrs['clip-path'];
  if (el.attrs['filter']) wrapper['filter'] = el.attrs['filter'];

  const inner = group.children.map(serializeSVG).join('');
  return openTag('g', wrapper, false) + inner + '</g>';
}

/** Dispatches to the generator method matching the element's geometry. */
function draw(rc: MLCRoughSVG<SVGNode>, el: XmlElement, options: Options): SVGNode | null {
  const a = el.attrs;
  switch (el.tag) {
    case 'rect': {
      const x = length(a['x'], 0), y = length(a['y'], 0);
      const w = length(a['width'], NaN), h = length(a['height'], NaN);
      if (!(w > 0) || !(h > 0) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
      const rxRaw = length(a['rx'], NaN), ryRaw = length(a['ry'], NaN);
      const rx = Number.isFinite(rxRaw) ? rxRaw : (Number.isFinite(ryRaw) ? ryRaw : 0);
      const ry = Number.isFinite(ryRaw) ? ryRaw : rx;
      if (rx > 0 || ry > 0) return rc.path(roundedRectPath(x, y, w, h, rx, ry), options);
      return rc.rectangle(x, y, w, h, options);
    }
    case 'circle': {
      const cx = length(a['cx'], 0), cy = length(a['cy'], 0), r = length(a['r'], NaN);
      if (!(r > 0) || !Number.isFinite(cx) || !Number.isFinite(cy)) return null;
      return rc.circle(cx, cy, r * 2, options);
    }
    case 'ellipse': {
      const cx = length(a['cx'], 0), cy = length(a['cy'], 0);
      const rx = length(a['rx'], NaN), ry = length(a['ry'], NaN);
      if (!(rx > 0) || !(ry > 0) || !Number.isFinite(cx) || !Number.isFinite(cy)) return null;
      return rc.ellipse(cx, cy, rx * 2, ry * 2, options);
    }
    case 'line': {
      const x1 = length(a['x1'], 0), y1 = length(a['y1'], 0);
      const x2 = length(a['x2'], 0), y2 = length(a['y2'], 0);
      if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
      if (x1 === x2 && y1 === y2) return null;
      return rc.line(x1, y1, x2, y2, { ...options, fill: undefined });
    }
    case 'polyline': {
      const points = parsePoints(a['points']);
      if (points.length < 2) return null;
      return rc.linearPath(points, options);
    }
    case 'polygon': {
      const points = parsePoints(a['points']);
      if (points.length < 3) return null;
      return rc.polygon(points, options);
    }
    case 'path': {
      const d = a['d'];
      if (!d || !d.trim()) return null;
      return rc.path(d, options);
    }
    default:
      return null;
  }
}

/**
 * Moves marker properties onto the last stroke path of the replacement.
 *
 * Markers are inherited properties, so putting them on the wrapping group
 * would paint an arrowhead on the fill paths as well. The last stroke path
 * carries the shape's real end point, so that is where the head belongs.
 */
function carryMarkers(group: SVGNode, el: XmlElement): void {
  const markers = ['marker-start', 'marker-end'].filter((m) => el.attrs[m]);
  if (!markers.length) return;
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    if (child.attributes['fill'] !== 'none') continue;
    for (const m of markers) child.attributes[m] = el.attrs[m];
    return;
  }
}

/** Normalizes the three accepted spellings of the option into one shape. */
function resolveTextBackground(option: boolean | string | TextBackground | undefined): Required<Pick<TextBackground, 'fill' | 'padding'>> & TextBackground | null {
  if (!option) return null;
  const given: TextBackground = typeof option === 'string' ? { fill: option } : (option === true ? {} : option);
  return { padding: 2, ...given, fill: given.fill ?? '#fff' };
}

/** The text a label element renders, entity references counted as one character. */
function labelText(node: XmlNode): string {
  if (node.type === 'raw') {
    return node.text.replace(/<[^>]*>/g, '').replace(/&[^;\s]{1,10};/g, '\u00b7').trim();
  }
  return node.children.map(labelText).join(' ').trim();
}

/** Reads a possibly-listed coordinate attribute, taking the first value. */
function firstNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = parseFloat(value.trim().split(/[\s,]+/)[0]);
  return Number.isFinite(n) ? n : fallback;
}

interface Box { x: number; y: number; width: number; height: number }

/**
 * Where a label sits.
 *
 * A `<foreignObject>` states its own box, so that case is exact. A `<text>`
 * does not, and working it out for real needs font metrics — which is exactly
 * what this library does not have, by design. So the box is estimated from the
 * font size and the number of characters, with 0.55 em as the average advance
 * width of a proportional sans-serif. That is close enough for a backing
 * plate, and wrong enough that it is worth saying so: a label in a condensed
 * or monospaced face, or one positioned per-glyph, gets a plate that does not
 * quite fit.
 */
function labelBox(el: XmlElement, style: Record<string, string>): Box | null {
  if (el.tag === 'foreignObject') {
    const width = length(el.attrs['width'], NaN);
    const height = length(el.attrs['height'], NaN);
    if (!(width > 0) || !(height > 0)) return null;
    return { x: length(el.attrs['x'], 0), y: length(el.attrs['y'], 0), width, height };
  }

  const text = labelText(el);
  if (!text) return null;
  const fontSize = length(usable(style['font-size']), 16);
  if (!(fontSize > 0)) return null;

  const width = text.length * fontSize * 0.55;
  const height = fontSize * 1.15;
  const x = firstNumber(el.attrs['x'], 0);
  const y = firstNumber(el.attrs['y'], 0);
  const anchor = usable(style['text-anchor']) || 'start';
  const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  // Without a stated baseline, y is the alphabetic one: most of the glyph
  // stands above it, the descenders below.
  return { x: left, y: y - fontSize * 0.8, width, height };
}

/** Builds the rect that goes behind a label, or null if it has no box. */
function textPlate(el: XmlElement, style: Record<string, string>, plate: TextBackground & { fill: string; padding: number }): string | null {
  if (style['display'] === 'none' || style['visibility'] === 'hidden') return null;
  const box = labelBox(el, style);
  if (!box) return null;

  const pad = plate.padding;
  const attrs: Record<string, string> = {
    x: String(round(box.x - pad)),
    y: String(round(box.y - pad)),
    width: String(round(box.width + 2 * pad)),
    height: String(round(box.height + 2 * pad)),
    fill: plate.fill,
  };
  if (plate.rx !== undefined) attrs['rx'] = String(plate.rx);
  if (plate.opacity !== undefined) attrs['opacity'] = String(plate.opacity);
  // The plate is a sibling, so it needs the same local transform as the label.
  if (el.attrs['transform']) attrs['transform'] = el.attrs['transform'];
  return openTag('rect', attrs, true);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
