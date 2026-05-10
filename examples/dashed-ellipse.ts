import mlcrough from '../src/mlcrough.js';

const rc = mlcrough.svgString({
  options: {
    strokeLineDash: [15, 5],
    strokeLineDashOffset: 10
  }
});
const shapes = [];

shapes.push(rc.ellipse(10 + 40, 10 + 40, 80, 80));
shapes.push(rc.ellipse(110 + 40, 10 + 40, 80, 80, { fill: 'red' }));
shapes.push(rc.ellipse(210 + 40, 10 + 40, 80, 80, { fill: 'pink', fillStyle: 'solid' }));
shapes.push(rc.ellipse(310 + 40, 10 + 40, 80, 80, { fill: 'red', fillStyle: 'cross-hatch' }));
shapes.push(rc.ellipse(410 + 40, 10 + 40, 80, 80, { fill: 'red', fillStyle: 'zigzag', hachureGap: 8 }));
shapes.push(rc.ellipse(510 + 40, 10 + 40, 80, 80, { fill: 'red', fillStyle: 'dots' }));

shapes.push(rc.circle(10 + 40, 110 + 40, 80, { roughness: 2 }));
shapes.push(rc.circle(110 + 40, 110 + 40, 80, { fill: 'red', stroke: 'blue', hachureAngle: 0, strokeWidth: 3, fillLineDash: [15, 5], fillLineDashOffset: 10 }));
shapes.push(rc.circle(210 + 40, 110 + 40, 80, { fill: 'pink', fillWeight: 3, hachureGap: 8, hachureAngle: 45, fillLineDash: [15, 5], fillLineDashOffset: 10 }));

shapes.push(rc.ellipse(300, 350, 480, 280, { fill: 'red', fillStyle: 'dots', hachureGap: 20, hachureAngle: 0, fillWeight: 2 }));

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${shapes.map(s => mlcrough.serialize(s)).join('')}
</svg>
`;

console.log(svg.trim());
