import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString({
  options: {
    strokeLineDash: [15, 5],
    strokeLineDashOffset: 10
  }
});
const shape = rc.polygon([
  [10, 10],
  [200, 10],
  [100, 100],
  [100, 50],
  [300, 100],
  [60, 200]
], { stroke: 'grey', strokeWidth: 2, fill: 'red', hachureAngle: 90, fillLineDash: [15, 5], fillLineDashOffset: 10 });

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${mlcrough.serialize(shape)}
</svg>
`;

console.log(svg.trim());
