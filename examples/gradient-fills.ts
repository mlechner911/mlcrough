import mlcrough from '../src/mlcrough.js';

/**
 * Demonstrates the new hand-drawn 'gradient' and 'radial-gradient' fill styles.
 * These styles vary hachure line opacity based on position or distance from center.
 */
function createGradientExample(): string {
  const rc = mlcrough.svgString();
  const width = 600;
  const height = 400;

  const elements: string[] = [];

  // 1. Linear Gradient: Fades from top-left to bottom-right (based on hachureAngle)
  const rect1 = rc.rectangle(50, 50, 200, 300, {
    fill: '#3498db',
    fillStyle: 'gradient',
    hachureAngle: 60,
    hachureGap: 4,
    strokeWidth: 1.5
  });
  elements.push(mlcrough.serialize(rect1));
  elements.push(`<text x="150" y="380" text-anchor="middle" font-family="sans-serif">Linear Gradient</text>`);

  // 2. Radial Gradient: Fades from center outwards
  const circle1 = rc.circle(450, 200, 250, {
    fill: '#e74c3c',
    fillStyle: 'radial-gradient',
    hachureAngle: -30,
    hachureGap: 5,
    strokeWidth: 1.5
  });
  elements.push(mlcrough.serialize(circle1));
  elements.push(`<text x="450" y="380" text-anchor="middle" font-family="sans-serif">Radial Gradient</text>`);

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

console.log(createGradientExample());
