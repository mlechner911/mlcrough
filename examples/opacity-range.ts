import mlcrough from '../src/mlcrough.js';

/**
 * Demonstrates the 'opacityRange' option which allows customizing the 
 * intensity of transparency variations in multi-styled fills.
 */
function createOpacityRangeExample(): string {
  const rc = mlcrough.svgString();
  const width = 600;
  const height = 400;

  const elements: string[] = [];

  // 1. Multi-Hachure with tight opacity range [0.7, 0.9] - Subtle variation
  const rect1 = rc.rectangle(50, 50, 200, 300, {
    fill: '#2980b9',
    fillStyle: 'multi-hachure',
    opacityRange: [0.7, 0.9],
    hachureGap: 4
  });
  elements.push(mlcrough.serialize(rect1));
  elements.push(`<text x="150" y="380" text-anchor="middle" font-family="sans-serif">Subtle Range [0.7, 0.9]</text>`);

  // 2. Multi-Hachure with wide opacity range [0.1, 1.0] - Dramatic variation
  const circle1 = rc.circle(450, 200, 250, {
    fill: '#c0392b',
    fillStyle: 'multi-hachure',
    opacityRange: [0.1, 1.0],
    hachureGap: 5
  });
  elements.push(mlcrough.serialize(circle1));
  elements.push(`<text x="450" y="380" text-anchor="middle" font-family="sans-serif">Dramatic Range [0.1, 1.0]</text>`);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

console.log(createOpacityRangeExample());
