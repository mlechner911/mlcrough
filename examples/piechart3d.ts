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
  flatten?: number;
  thickness?: number;
}

/**
 * Demonstrates how to create a 3D hand-drawn pie chart using MLCRough.
 * Uses perspective flattening and side-wall path generation.
 */
function create3DPieChart(data: PieData[], options: PieOptions = {}): string {
  const {
    centerX = 250,
    centerY = 220,
    radius = 180,
    width = 500,
    height = 500,
    flatten = 0.6,
    thickness = 25,
  } = options;

  const rc = mlcrough.svgString();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let startAngle = 0;

  const elements: string[] = [];

  data.forEach((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    // --- Calculate Offset for "Exploded" View ---
    const off = d.highlight ? 15 : 0;
    const offX = Math.cos(midAngle) * off;
    const offY = Math.sin(midAngle) * off * flatten;

    const x = centerX + offX;
    const y = centerY + offY;

    // --- Geometry for the slice (with flattening) ---
    const x1 = x + Math.cos(startAngle) * radius;
    const y1 = y + Math.sin(startAngle) * radius * flatten;
    const x2 = x + Math.cos(endAngle) * radius;
    const y2 = y + Math.sin(endAngle) * radius * flatten;

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    // 1. SIDE WALL (Shadow effect)
    // Only visible for parts of the arc
    const sidePath = `M ${x1} ${y1} A ${radius} ${radius * flatten} 0 ${largeArc} 1 ${x2} ${y2} 
                      L ${x2} ${y2 + thickness} A ${radius} ${radius * flatten} 0 ${largeArc} 0 ${x1} ${y1 + thickness} Z`;
    
    const side = rc.path(sidePath, {
      fill: 'rgba(0,0,0,0.15)',
      fillStyle: 'solid',
      stroke: 'rgba(0,0,0,0.5)',
    });
    elements.push(mlcrough.serialize(side));

    // 2. TOP LID (The colored area)
    const topPath = `M ${x} ${y} L ${x1} ${y1} A ${radius} ${radius * flatten} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const top = rc.path(topPath, {
      fill: d.color,
      fillStyle: 'hachure',
      hachureAngle: 45,
      hachureGap: 5,
    });
    elements.push(mlcrough.serialize(top));

    // 3. TEXT PLACEMENT
    const textDist = radius * 0.6;
    const tx = x + Math.cos(midAngle) * textDist;
    const ty = y + Math.sin(midAngle) * textDist * flatten;

    elements.push(`
      <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" 
            fill="white" font-family="sans-serif" font-size="14" font-weight="bold" 
            style="text-shadow: 1px 1px 2px rgba(0,0,0,0.8); pointer-events: none;">
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
  { label: 'Cloud', value: 45, color: '#3498db' },
  { label: 'Edge', value: 25, color: '#e67e22', highlight: true },
  { label: 'Legacy', value: 30, color: '#95a5a6' },
];

const svgPie3d = create3DPieChart(myData);
console.log(svgPie3d);
