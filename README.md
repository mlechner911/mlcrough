# MLCRough

MLCRough is a small (<9KB gzipped) graphics library that lets you draw in a **hand-drawn**, **sketchy** style.

MLCRough works with **SVG** and is completely **DOM-independent**, making it suitable for both Node.js and browser environments.

## Installation

```
npm install --save mlcrough
```

Or get the latest using unpkg: https://unpkg.com/mlcrough@latest/dist/mlcrough.js

MLCRough is exported as a single ES6 module.

## Usage

MLCRough allows you to generate SVG nodes that can be serialized to a string.

```js
import mlcrough from 'mlcrough';

const rc = mlcrough.svgString();
const node = rc.rectangle(10, 10, 200, 200); // x, y, width, height
const svgString = mlcrough.serialize(node);
console.log(svgString);
```

### Examples

See the `examples` directory for more usage examples.

## License
MIT
