# MLCRough

[![npm version](https://img.shields.io/npm/v/mlcrough.svg)](https://www.npmjs.com/package/mlcrough)
[![license](https://img.shields.io/npm/l/mlcrough.svg)](LICENSE)
[![types](https://img.shields.io/npm/types/mlcrough.svg)](dist/mlcrough.d.ts)

MLCRough is a small (~10KB gzipped) graphics library that lets you draw in a **hand-drawn**, **sketchy** style.

Anything that emits SVG can be put in front of it. On the left what the tool
produced, on the right the same document after `roughen()` — same shapes, same
colours, same labels, drawn by hand.

<table>
<tr><th width="50%">Original</th><th width="50%"><code>roughen()</code></th></tr>
<tr>
<td><img src="https://raw.githubusercontent.com/mlechner911/mlcrough/main/docs/images/pipeline-original.svg" alt="How roughen() works, as a Mermaid flowchart" width="100%"></td>
<td><img src="https://raw.githubusercontent.com/mlechner911/mlcrough/main/docs/images/pipeline-rough.svg" alt="The same flowchart, sketched" width="100%"></td>
</tr>
<tr>
<td><img src="https://raw.githubusercontent.com/mlechner911/mlcrough/main/docs/images/chart-original.svg" alt="Time series chart with a min/max band" width="100%"></td>
<td><img src="https://raw.githubusercontent.com/mlechner911/mlcrough/main/docs/images/chart-rough.svg" alt="The same chart, sketched" width="100%"></td>
</tr>
</table>

*Top: how `roughen()` works, drawn by Mermaid and then redrawn by `roughen()` —
the diagram explaining the transform is produced by the transform. Bottom: a
chart from [`ml-time-graph`](https://www.npmjs.com/package/ml-time-graph),
rendered and sketched in the same process, with no browser anywhere in the
chain. Both figures come out of `bin/render-readme-images.ts`, so they cannot
fall out of step with the code.*

### Origin and Modernization
This project is a modernized fork of the excellent [Rough.js](https://github.com/pshihn/rough) by Preet Shihn.

**Key changes in MLCRough:**
- **DOM & Canvas Independent:** All dependencies on the browser-specific DOM and Canvas APIs have been removed. This allows the library to run seamlessly in **Node.js**, Server-Side Rendering (SSR) environments, and other non-browser contexts.
- **Pure ES6/ESM:** Re-architected as a clean ES6 module for 2026 standards.
- **Modern TypeScript:** Fully updated to **TypeScript 6.0** with strict typing and improved API ergonomics.
- **Advanced Textures:** New fill styles for artistic shading, including `multi-hachure`, `multi-dots`, and position-based `gradient` and `radial-gradient`.
- **Refactored Architecture:** Modularized source code with a stateful `Renderer` and specialized shape modules for easier maintainability and extensibility.
- **Roughen existing SVG:** `roughen()` takes a finished SVG document — from Mermaid, D3, Graphviz, a charting library — and redraws it by hand. See below.

## Installation

```bash
npm install mlcrough
```

### CDN (Browser)

You can use **mlcrough** directly in the browser via [unpkg](https://unpkg.com/mlcrough):

```html
<script type="module">
  import mlcrough from 'https://unpkg.com/mlcrough';
  
  const rc = mlcrough.svgString();
  const node = rc.rectangle(10, 10, 200, 200);
  console.log(mlcrough.serialize(node));
</script>
```

## Usage

MLCRough generates abstract SVG nodes that can be easily serialized to a string.

See the [Usage Guide](USAGE.md) for detailed instructions and styling options.

```js
import mlcrough from 'mlcrough';

const rc = mlcrough.svgString();
const node = rc.rectangle(10, 10, 200, 200); // x, y, width, height
const svgString = mlcrough.serialize(node);
console.log(svgString);
```

## Roughening an SVG someone else made

The generator API asks you to describe a shape. `roughen()` turns that around:
hand it a finished SVG and get the same drawing back, sketched.

```js
import mlcrough from 'mlcrough';

const sketch = mlcrough.roughen(svgString, { roughness: 1.4, fillStyle: 'hachure' });
```

Or from the shell, which is where this tends to be useful:

```bash
mmdc -i graph.mmd -o graph.svg && npx mlcrough graph.svg -o sketch.svg
```

Shapes (`rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`) are
replaced in place; text, markers, gradients and the surrounding markup are
passed through untouched. Colours are read from wherever they actually live —
including the `<style>` block that generated documents put their real styling
in, cascade and specificity resolved.

Because this library needs neither a DOM nor a canvas, the whole chain runs in
Node, in a build step or in CI:

```
data → chart library → SVG → roughen() → SVG
```

Two worked examples are in `examples/`:

| Example | What it shows |
| :--- | :--- |
| `roughen-mermaid.ts` | Unedited Mermaid CLI output, redrawn — including the styles Mermaid keeps in its embedded stylesheet. |
| `roughen-timegraph.ts` | A live pipeline: [`ml-time-graph`](https://www.npmjs.com/package/ml-time-graph) renders a chart in the same process, `roughen()` sketches it, and `onShape` keeps the axes straight while the data curve wavers. |

See the [Usage Guide](USAGE.md#redrawing-an-existing-svg) for options,
the `onShape` hook and the CLI flags.

### Advanced Examples
The library now includes sophisticated data visualization examples:
- **3D Bar Charts:** Hand-drawn bars with depth.
- **Pie Charts:** Hand-drawn slices with "exploded" view support.
- **Advanced 3D Pie Charts:** Utilizing the Painter's Algorithm for correct depth sorting and perspective flattening.

See the `examples` directory for the full source of these implementations.

## Development

```bash
npm install
npm run dev          # Vite playground on http://localhost:3000
npm run build        # typecheck, bundle, and emit dist/mlcrough.d.ts
npm run typecheck    # library, CLI and playground, each with its own tsconfig
npm run lint
task test            # run every example and build the visual dashboard
npm run images       # regenerate the figures at the top of this file
```

The playground loads the library from `src/`, so a change to a filler or to the
cascade resolver shows up on the next save. It puts a source document and its
sketched result side by side, with the drawing options on sliders — drop an SVG
file on the page to use your own. Individual samples are linkable
(`#mermaid`, `#timegraph`, `#handwritten`).

The library itself is compiled without DOM or Node type definitions, which is
what keeps the "runs anywhere" promise honest. The CLI and the playground each
carry their own `tsconfig`, so the types they need never leak into the library
build.

## Author

**Michael Lechner** — [github.com/mlechner911](https://github.com/mlechner911)

## License

MIT — see [LICENSE](LICENSE).

Copyright © 2026 Michael Lechner.
Copyright © 2019 Preet Shihn, for the [Rough.js](https://github.com/pshihn/rough)
code this was forked from.
