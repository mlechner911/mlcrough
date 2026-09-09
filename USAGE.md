# MLCRough Usage Guide

MLCRough is a modernized, DOM-independent version of the classic Rough.js library. It allows you to generate hand-drawn, sketchy graphics as SVG strings, making it perfect for Node.js, Server-Side Rendering (SSR), and automated reports.

## Installation

Install the package via npm:

```bash
npm install mlcrough
```

## Basic Concepts

MLCRough works by generating **abstract SVG nodes**. You use a generator to create these nodes and then a serializer to convert them into a standard SVG string.

### 1. Initialization

First, import the library and create an `svgString` instance.

```javascript
import mlcrough from 'mlcrough';

// Create a generator for SVG strings
const rc = mlcrough.svgString();
```

### 2. Drawing Basic Shapes

You can draw standard geometric primitives. Every drawing method returns an abstract node.

```javascript
// Line: x1, y1, x2, y2
const line = rc.line(10, 10, 190, 10);

// Rectangle: x, y, width, height
const rect = rc.rectangle(10, 30, 180, 50, { fill: 'red' });

// Circle: centerX, centerY, diameter
const circle = rc.circle(50, 150, 80, { fill: 'blue', fillStyle: 'zigzag' });

// Ellipse: centerX, centerY, width, height
const ellipse = rc.ellipse(150, 150, 80, 50, { stroke: 'green', strokeWidth: 2 });
```

### 3. Serialization

To actually get an SVG string you can use in your HTML or save to a file, use the `serialize` method.

```javascript
const node = rc.rectangle(10, 10, 100, 100, { fill: 'yellow' });
const svgPathString = mlcrough.serialize(node);

// Wrap it in a root <svg> tag
const finalSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">${svgPathString}</svg>`;
```

---

## Styling Options

Most drawing methods accept an `options` object as the last parameter.

| Option | Type | Description |
| :--- | :--- | :--- |
| `stroke` | `string` | Color of the line (e.g., '#000', 'red'). |
| `strokeWidth` | `number` | Thickness of the line. |
| `fill` | `string` | Color to fill the shape with. |
| `fillStyle` | `string` | Style of the fill: `'hachure'`, `'solid'`, `'zigzag'`, `'cross-hatch'`, `'dots'`, `'dashed'`, `'zigzag-line'`, `'multi-hachure'`, `'gradient'`, `'radial-gradient'`, `'multi-dots'`. |
| `opacity` | `number` | Transparency level (0.0 to 1.0) for the stroke or fill. |
| `opacityRange` | `[number, number]` | Range for randomized transparency in multi-styled fills (default vary by style). |
| `roughness` | `number` | How "messy" the lines are (default: 1). |
| `bowing` | `number` | How much lines curve (default: 1). |
| `hachureAngle` | `number` | Angle of hachure lines in degrees. |
| `hachureGap` | `number` | Distance between hachure lines. |

---

## Advanced Usage

### Custom SVG Paths

You can use standard SVG path data strings. MLCRough will automatically normalize complex commands (like Arcs) to ensure they look great with hachure fills.

```javascript
const pathData = "M 10 10 L 100 10 A 50 50 0 0 1 100 100 Z";
const customShape = rc.path(pathData, { fill: 'purple', fillStyle: 'dots' });
```

### Advanced Shading: Multi-Hachure & Multi-Dots

These styles create a more organic, artistic look by randomly distributing hachure lines or dots with varying opacity levels.

```javascript
// Organic shading with varying line transparency
rc.circle(100, 100, 150, {
  fill: 'blue',
  fillStyle: 'multi-hachure',
  opacityRange: [0.1, 1.0], // Wide range for dramatic variation
  hachureAngle: 60,
  hachureGap: 4
});

// Organic dotted pattern with varying dot transparency
rc.rectangle(50, 50, 200, 200, {
  fill: 'red',
  fillStyle: 'multi-dots',
  hachureGap: 10
});
```

### Sketchy Gradients: Linear & Radial

Unlike standard SVG gradients, these styles vary the transparency of individual hachure lines based on their position, providing a "pressure-sensitive" drawing feel.

```javascript
// Fades from one side to the other based on hachureAngle
rc.rectangle(10, 10, 100, 300, {
  fill: 'green',
  fillStyle: 'gradient'
});

// Fades from the center outwards
rc.circle(200, 200, 150, {
  fill: 'purple',
  fillStyle: 'radial-gradient'
});
```

### Generating 3D Effects

By combining multiple paths and using the **Painter's Algorithm** (drawing back-to-front), you can create sophisticated 3D visualizations.

For a full list of examples and visual outputs, see the [Visual Gallery](test-output/README.md).

```javascript
// Simplified 3D Bar logic
const barFront = rc.rectangle(x, y, w, h, { fill: 'blue' });
const barTop = rc.polygon([[x,y], [x+d, y-d], [x+w+d, y-d], [x+w, y]], { fill: 'white', fillStyle: 'solid' });

const svg = `
<svg ...>
  ${mlcrough.serialize(barTop)}
  ${mlcrough.serialize(barFront)}
</svg>`;
```

---

## Redrawing an existing SVG

Everything above asks you to describe a shape. `roughen()` turns that around:
give it a finished SVG document and it hands back the same drawing, sketched.

```js
import mlcrough from 'mlcrough';
import { readFileSync, writeFileSync } from 'node:fs';

const sketch = mlcrough.roughen(readFileSync('diagram.svg', 'utf8'), {
  roughness: 1.4,
  fillStyle: 'hachure',
});
writeFileSync('sketch.svg', sketch);
```

This is the reason the library is DOM-free: the input usually comes from
another program — Mermaid, D3, Graphviz, a charting library, a reporting
backend — and the whole chain has to run on a server or in a build step.

### What it touches, and what it does not

`rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` and `path` are
replaced, each by a group of hand-drawn paths. The replacement takes the exact
place of the element it stands for, so every enclosing `transform` still
applies and no coordinate is recomputed.

Everything else is passed through byte for byte: text, the surrounding markup,
comments, entity references, attribute quoting. Referenced material is left
alone as well — `defs`, `marker`, `clipPath`, `mask`, `pattern`, `symbol` —
because a sketched arrowhead is redrawn at every position that references it,
and a roughened clip path stops clipping cleanly. Pass `includeDefs: true` if
that is what you want.

### Colours usually live in a stylesheet

Generated SVG rarely puts paint on the element. Mermaid, for instance, emits

```html
<rect class="basic label-container" x="-109" y="-27" width="218" height="54"/>
```

and leaves the colours to a stylesheet embedded in the same document:

```css
#my-svg .node rect, … { fill:#ECECFF; stroke:#9370DB; stroke-width:1px; }
```

So `roughen()` resolves the cascade before it redraws anything — presentation
attributes, embedded `<style>` rules with specificity and source order,
inherited properties, `!important`, and the inline `style` attribute. Without
that, every box would come out in the SVG default of solid black.

Not supported, and skipped rather than guessed at: sibling combinators
(`+`, `~`), pseudo-classes, and `@media` and other conditional groups. External
stylesheets are not fetched.

### Options

`roughen()` takes every drawing option (`roughness`, `bowing`, `fill`,
`fillStyle`, `hachureAngle`, …) plus three of its own:

| Option | Default | Meaning |
| :--- | :--- | :--- |
| `seed` | `1` | A fixed seed, so the same input gives byte-identical output on every run. Set `0` for a fresh sketch each time. |
| `padding` | `2 + 2 * roughness` | User units added around the root `viewBox`. Generated documents are cropped exactly to their content, and a sketched line wanders outside the shape it stands for — without this, the outermost strokes are clipped. |
| `includeDefs` | `false` | Also redraw shapes inside `defs`, `marker`, `clipPath`, … |
| `textBackground` | off | Lay a plate of colour behind every label, so text stays readable where a hachure fill runs under it. |
| `onShape` | — | Called for every shape before it is redrawn. |

`onShape` is the escape hatch. It receives the element's tag, its attributes,
its computed style and a running index; return extra options for that shape
alone, or `false` to leave the element untouched.

```js
mlcrough.roughen(chartSvg, {
  roughness: 1.5,
  bowing: 1,
  // `bowing` is proportional to line length, so the value that gives the data
  // curve a pleasant waver bends a 320px axis into a visible arc.
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
});
```

### Keeping labels readable

Hachure runs straight under the text, which a solid fill never did. So there is
an option to put a plate behind every label:

```js
mlcrough.roughen(svg, { textBackground: true });                  // white
mlcrough.roughen(svg, { textBackground: '#fffdf5' });             // a colour
mlcrough.roughen(svg, { textBackground: { fill: '#fff', padding: 1.5, opacity: 0.85, rx: 2 } });
```

How exact the plate is depends on what it sits behind. A `<foreignObject>` —
which is what Mermaid puts its labels in — states its own width and height, so
that case is exact. A `<text>` does not, and working out its real extent needs
font metrics, which is precisely what a library with no DOM and no canvas does
not have. There the box is estimated from the font size and the number of
characters, at 0.55 em average advance width. That is close enough for a
backing plate under a normal proportional face, and noticeably off for a
condensed or monospaced one, or for text positioned per glyph.

### From the command line

The interesting inputs are produced by other programs, so there is a CLI:

```bash
npx mlcrough diagram.svg -o sketch.svg
npx mlcrough --fill-style solid --roughness 2 chart.svg > sketch.svg
cat chart.svg | npx mlcrough --seed 0 > sketch.svg
npx mlcrough --text-background '#fffdf5' diagram.svg -o sketch.svg
```

Which makes the whole thing a pipeline:

```bash
mmdc -i graph.mmd -o graph.svg && mlcrough graph.svg -o sketch.svg
```

`mlcrough --help` lists every flag.

---

## Technical Details

- **Environment:** Node.js 18+, Modern Browsers.
- **Standards:** ES6 Modules (ESM).
- **Type Safety:** Built with TypeScript 6.0.
- **Footprint:** < 10KB (gzipped).

For full source code examples, check the `examples/` directory in the repository.
