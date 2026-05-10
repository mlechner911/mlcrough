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
| `fillStyle` | `string` | Style of the fill: `'hachure'`, `'solid'`, `'zigzag'`, `'cross-hatch'`, `'dots'`, `'dashed'`, `'zigzag-line'`, `'multi-hachure'`, `'gradient'`, `'radial-gradient'`. |
| `opacity` | `number` | Transparency level (0.0 to 1.0) for the stroke or fill. |
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

### Advanced Shading: Multi-Hachure

The `multi-hachure` style creates a more organic, artistic look by randomly distributing lines with four different opacity levels (`0.4`, `0.5`, `0.6`, `0.9`). This produces a hand-shaded effect that looks less mechanical than standard hachure.

```javascript
rc.circle(100, 100, 150, {
  fill: 'blue',
  fillStyle: 'multi-hachure',
  hachureAngle: 60,
  hachureGap: 4
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

## Technical Details

- **Environment:** Node.js 18+, Modern Browsers.
- **Standards:** ES6 Modules (ESM).
- **Type Safety:** Built with TypeScript 6.0.
- **Footprint:** < 10KB (gzipped).

For full source code examples, check the `examples/` directory in the repository.
