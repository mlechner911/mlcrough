# MLCRough

MLCRough is a small (<9KB gzipped) graphics library that lets you draw in a **hand-drawn**, **sketchy** style.

### Origin and Modernization
This project is a modernized fork of the excellent [Rough.js](https://github.com/pshihn/rough) by Preet Shihn.

**Key changes in MLCRough:**
- **DOM & Canvas Independent:** All dependencies on the browser-specific DOM and Canvas APIs have been removed. This allows the library to run seamlessly in **Node.js**, Server-Side Rendering (SSR) environments, and other non-browser contexts.
- **Pure ES6/ESM:** Re-architected as a clean ES6 module for 2026 standards.
- **Modern TypeScript:** Fully updated to **TypeScript 6.0** with strict typing and improved API ergonomics.
- **Advanced Textures:** New `multi-hachure` fill style for organic, multi-tone shading with randomized transparency distribution.
- **Refactored Architecture:** Modularized source code with a stateful `MLCRoughRenderer` and specialized shape modules for better maintainability and extensibility.

## Installation

```bash
npm install --save mlcrough
```

Or get the latest using unpkg: `https://unpkg.com/mlcrough@latest/dist/mlcrough.js`

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

### Advanced Examples
The library now includes sophisticated data visualization examples:
- **3D Bar Charts:** Hand-drawn bars with depth.
- **Pie Charts:** Hand-drawn slices with "exploded" view support.
- **Advanced 3D Pie Charts:** Utilizing the Painter's Algorithm for correct depth sorting and perspective flattening.

See the `examples` directory for the full source of these implementations.

## License
MIT (Inherited from Rough.js)
