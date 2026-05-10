import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString();
const shapes = [];

shapes.push(rc.rectangle(10, 10, 80, 80));
shapes.push(rc.rectangle(110, 10, 80, 80, { fill: 'red' }));
shapes.push(rc.rectangle(210, 10, 80, 80, { fill: 'pink', fillStyle: 'solid' }));
shapes.push(rc.rectangle(310, 10, 80, 80, { fill: 'red', fillStyle: 'cross-hatch' }));
shapes.push(rc.rectangle(410, 10, 80, 80, { fill: 'red', fillStyle: 'zigzag', hachureGap: 8 }));
shapes.push(rc.rectangle(510, 10, 80, 80, { fill: 'red', fillStyle: 'dots' }));

shapes.push(rc.rectangle(10, 110, 80, 80, { roughness: 2 }));
shapes.push(rc.rectangle(110, 110, 80, 80, { fill: 'red', stroke: 'blue', hachureAngle: 0, strokeWidth: 3 }));
shapes.push(rc.rectangle(210, 110, 80, 80, { fill: 'pink', fillWeight: 5, hachureGap: 10, hachureAngle: 90 }));

shapes.push(rc.rectangle(10, 210, 480, 280, { fill: 'red', fillStyle: 'dots', hachureGap: 20, fillWeight: 2 }));

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${shapes.map(s => mlcrough.serialize(s)).join('')}
</svg>
`;

console.log(svg.trim());
