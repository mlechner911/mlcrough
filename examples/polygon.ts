import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString();
const shape = rc.polygon([
  [10, 10],
  [200, 10],
  [100, 100],
  [100, 50],
  [300, 100],
  [60, 200]
], { fillStyle: 'solid', stroke: 'black', strokeWidth: 2, fill: 'red', hachureAngle: 90 });

rc.path('M80 80 A 45 45, 0, 0, 0, 125 125 L 125 80 Z', { fill: 'green' });
rc.path('M230 80 A 45 45, 0, 1, 0, 275 125 L 275 80 Z', { fill: 'purple' });
rc.path('M80 230 A 45 45, 0, 0, 1, 125 275 L 125 230 Z', { fill: 'red' });
rc.path('M230 230 A 45 45, 0, 1, 1, 275 275 L 275 230 Z', { fill: 'blue' });
const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${mlcrough.serialize(shape)}
</svg>
`;

console.log(svg.trim());
