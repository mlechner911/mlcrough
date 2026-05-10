import mlcrough from '../src/mlcrough.js';

/**
 * Demonstrates the new 'multi-hachure' fill style which uses varying opacities
 * for individual groups of lines within a single shape.
 */
function createMultiStyleExample(): string {
  const rc = mlcrough.svgString();
  const width = 400;
  const height = 400;

  const elements: string[] = [];

  // Large rectangle with multi-tone hachure
  const rect = rc.rectangle(50, 50, 300, 300, {
    fill: '#3498db',
    fillStyle: 'multi-hachure',
    hachureAngle: 60,
    hachureGap: 4,
    strokeWidth: 2
  });
  elements.push(mlcrough.serialize(rect));

  // A circle with multi-tone hachure
  const circle = rc.circle(200, 200, 150, {
    fill: '#e74c3c',
    fillStyle: 'multi-hachure',
    hachureAngle: -30,
    hachureGap: 6
  });
  elements.push(mlcrough.serialize(circle));

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f2f5" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

console.log(createMultiStyleExample());
