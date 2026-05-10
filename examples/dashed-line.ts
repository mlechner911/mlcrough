import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString({
  options: {
    strokeLineDash: [15, 5],
    strokeLineDashOffset: 10
  }
});
const shapes = [];

shapes.push(rc.line(10, 10, 100, 10));
shapes.push(rc.line(10, 210, 500, 210));
shapes.push(rc.line(10, 20, 10, 110, { stroke: 'red' }));
shapes.push(rc.line(10, 10, 100, 10));
shapes.push(rc.line(50, 30, 200, 100, { stroke: 'blue', strokeWidth: 5 }));

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${shapes.map(s => mlcrough.serialize(s)).join('')}
</svg>
`;

console.log(svg.trim());
