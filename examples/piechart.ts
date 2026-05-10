import mlcrough from '../src/mlcrough.js';

interface PieData {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}

interface PieOptions {
  centerX?: number;
  centerY?: number;
  radius?: number;
  width?: number;
  height?: number;
}

/**
 * Demonstrates how to create a hand-drawn pie chart using MLCRough.
 * This example uses custom SVG path data for the slices.
 */
function createPieChart(data: PieData[], options: PieOptions = {}): string {
  const {
    centerX = 250,
    centerY = 250,
    radius = 180,
    width = 500,
    height = 500,
  } = options;

  const rc = mlcrough.svgString();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = -Math.PI / 2; // Start at 12 o'clock

  const elements: string[] = [];

  data.forEach((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // --- Calculate Offset for Highlighting ---
    let x = centerX;
    let y = centerY;
    if (d.highlight) {
      const middleAngle = startAngle + sliceAngle / 2;
      const offset = 20; // Distance the slice "explodes" out
      x += Math.cos(middleAngle) * offset;
      y += Math.sin(middleAngle) * offset;
    }

    // --- Geometry for the slice ---
    const x1 = x + Math.cos(startAngle) * radius;
    const y1 = y + Math.sin(startAngle) * radius;
    const x2 = x + Math.cos(endAngle) * radius;
    const y2 = y + Math.sin(endAngle) * radius;

    // SVG path: Move to center, Line to start of arc, Arc to end of arc, Close path
    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
    const pathData = `M ${x} ${y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    const slice = rc.path(pathData, {
      fill: d.color,
      fillStyle: 'hachure',
      hachureAngle: 45,
      hachureGap: 5,
    });
    elements.push(mlcrough.serialize(slice));

    // --- Add Label ---
    const labelAngle = startAngle + sliceAngle / 2;
    const labelRadius = radius * 0.7; // Position label inside the slice
    const lx = x + Math.cos(labelAngle) * labelRadius;
    const ly = y + Math.sin(labelAngle) * labelRadius;

    elements.push(`
      <text 
        x="${lx}" 
        y="${ly}" 
        text-anchor="middle" 
        font-family="sans-serif" 
        font-size="14" 
        font-weight="bold"
        fill="white"
        style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5)">
        ${d.label}
      </text>
    `);

    startAngle = endAngle;
  });

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f8f9fa" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

// Example execution:
const myData: PieData[] = [
  { label: 'A', value: 30, color: '#e74c3c' },
  { label: 'B', value: 50, color: '#3498db', highlight: true },
  { label: 'C', value: 20, color: '#2ecc71' },
  { label: 'D', value: 40, color: '#f1c40f' },
];

const svgPie = createPieChart(myData);
console.log(svgPie);
