import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString();
const shapes = [];

shapes.push(rc.polygon([
  [50, 10],
  [150, 10],
  [200, 100],
  [150, 190],
  [50, 190],
  [10, 100],
], { fillStyle: 'solid', stroke: 'black', strokeWidth: 2, fill: 'red' }));

shapes.push(rc.path('M80 80 A 45 45, 0, 0, 0, 125 125 L 125 80 Z', { fill: 'green', fillStyle: 'solid' }));
shapes.push(rc.path('M230 80 A 45 45, 0, 1, 0, 275 125 L 275 80 Z', { fill: 'purple', fillStyle: 'solid' }));
shapes.push(rc.path('M80 230 A 45 45, 0, 0, 1, 125 275 L 125 230 Z', { fill: 'red', fillStyle: 'solid' }));
shapes.push(rc.path('M230 230 A 45 45, 0, 1, 1, 275 275 L 275 230 Z', { fill: 'blue', fillStyle: 'solid' }));

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  ${shapes.map((s) => mlcrough.serialize(s)).join('')}
</svg>
`;

console.log(svg.trim());
