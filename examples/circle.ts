import mlcrough from '../src/mlcrough.js';
import { serializeSVG } from '../src/svg.js';

const rc = mlcrough.svgString();
const node = rc.circle(150, 150, 200, {
  fill: 'blue',
  stroke: 'black',
  strokeWidth: 2,
  fillStyle: 'zigzag'
});

const svgString = `
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  ${serializeSVG(node)}
</svg>
`;

console.log(svgString.trim());
