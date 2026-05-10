import mlcrough from '../src/mlcrough.js';

/**
 * Demonstrates the new 'multi-dots' fill style which uses varying opacities
 * for individual dots within a single shape.
 */
function createMultiDotExample(): string {
  const rc = mlcrough.svgString();
  const width = 600;
  const height = 400;

  const elements: string[] = [];

  // A square with multi-tone dots
  const rect = rc.rectangle(50, 50, 200, 300, {
    fill: '#27ae60',
    fillStyle: 'multi-dots',
    hachureGap: 10,
    fillWeight: 3
  });
  elements.push(mlcrough.serialize(rect));
  elements.push(`<text x="150" y="380" text-anchor="middle" font-family="sans-serif">Multi-Dots Square</text>`);

  // A circle with multi-tone dots
  const circle = rc.circle(450, 200, 250, {
    fill: '#8e44ad',
    fillStyle: 'multi-dots',
    hachureGap: 8,
    fillWeight: 4
  });
  elements.push(mlcrough.serialize(circle));
  elements.push(`<text x="450" y="380" text-anchor="middle" font-family="sans-serif">Multi-Dots Circle</text>`);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

console.log(createMultiDotExample());
