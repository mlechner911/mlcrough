import rough from '../src/rough';

const rc = rough.svgString();
const shape = rc.polygon([
  [10, 10],
  [200, 10],
  [100, 100],
  [100, 50],
  [300, 100],
  [60, 200]
], { fillStyle: 'solid', stroke: 'black', strokeWidth: 2, fill: 'red', hachureAngle: 90 });

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${rough.serialize(shape)}
</svg>
`;

console.log(svg.trim());
