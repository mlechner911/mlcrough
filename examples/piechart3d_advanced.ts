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
  thickness?: number;
  flatten?: number;
  width?: number;
  height?: number;
}

/**
 * Advanced 3D Pie Chart implementation using the Painter's Algorithm 
 * to correctly sort slices from back to front.
 * 
 * Features:
 * - Back-to-front rendering (Painter's Algorithm)
 * - Inner and Outer side walls for realistic depth
 * - Opaque masking for clean overlaps
 * - Thicker hachure lines for better visibility
 */
function generate3DPie(data: PieData[], options: PieOptions = {}): string {
  const {
    centerX = 250,
    centerY = 200,
    radius = 150,
    thickness = 30,
    flatten = 0.6,
    width = 500,
    height = 400,
  } = options;

  const rc = mlcrough.svgString();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  const elements: string[] = [];

  // 1. Prepare & Sort (Painter's Algorithm: Back to Front)
  const preparedData = data.map((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const res = {
      ...d,
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      midAngle: currentAngle + sliceAngle / 2,
    };
    currentAngle += sliceAngle;
    return res;
  });

  // Sort segments that are "higher" in the ellipse (back) to the front of the array
  // so they are drawn first. (sin is negative for the back half in SVG coordinates)
  preparedData.sort((a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle));

  preparedData.forEach((d) => {
    const { startAngle, endAngle, midAngle } = d;
    const sliceAngle = endAngle - startAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    // Offset for highlighted pieces
    const off = d.highlight ? 20 : 0;
    const ox = Math.cos(midAngle) * off;
    const oy = Math.sin(midAngle) * off * flatten;

    const x = centerX + ox;
    const y = centerY + oy;

    // Ellipse corner points
    const p1 = { x: x + Math.cos(startAngle) * radius, y: y + Math.sin(startAngle) * radius * flatten };
    const p2 = { x: x + Math.cos(endAngle) * radius, y: y + Math.sin(endAngle) * radius * flatten };

    // --- A. THE SIDE WALLS (Outer, Start, End) ---
    const sidePaths: string[] = [];
    
    // Outer arc wall
    sidePaths.push(`M ${p1.x} ${p1.y} A ${radius} ${radius * flatten} 0 ${largeArc} 1 ${p2.x} ${p2.y} 
                    L ${p2.x} ${p2.y + thickness} A ${radius} ${radius * flatten} 0 ${largeArc} 0 ${p1.x} ${p1.y + thickness} Z`);
    
    // Inner walls leading to the center
    sidePaths.push(`M ${x} ${y} L ${p1.x} ${p1.y} L ${p1.x} ${p1.y + thickness} L ${x} ${y + thickness} Z`);
    sidePaths.push(`M ${x} ${y} L ${p2.x} ${p2.y} L ${p2.x} ${p2.y + thickness} L ${x} ${y + thickness} Z`);

    sidePaths.forEach((path) => {
      // 1. Opaque Masking (Bleibt weiß, um Überlagerungen zu verhindern)
      elements.push(mlcrough.serialize(rc.path(path, { 
        fill: 'white', 
        fillStyle: 'solid', 
        stroke: 'none' 
      })));

      // 2. Klassischer grauer Schatten für die Grundtiefe
      elements.push(mlcrough.serialize(rc.path(path, { 
        fill: 'rgba(0,0,0,0.1)', 
        fillStyle: 'solid', 
        stroke: '#666', 
        strokeWidth: 0.5 
      })));

      // 3. Farbige Akzent-Schraffur (vertikale Linien in Segmentfarbe)
      elements.push(mlcrough.serialize(rc.path(path, { 
        fill: d.color,
        fillStyle: 'hachure',
        hachureAngle: 90,
        hachureGap: 10,
        stroke: 'none' 
      })));
    });

    // --- B. THE TOP LID (Top Face) ---
    const topPath = `M ${x} ${y} L ${p1.x} ${p1.y} A ${radius} ${radius * flatten} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
    
    // Masking for the lid
    elements.push(mlcrough.serialize(rc.path(topPath, { fill: 'white', fillStyle: 'solid', stroke: 'none' })));
    // Colored hachure fill
    elements.push(mlcrough.serialize(rc.path(topPath, {
      fill: d.color,
      fillStyle: 'multi-hachure',
      hachureAngle: 60,
      hachureGap: 5,
      fillWeight: 1.5, // Thicker hachure lines
      stroke: '#000',
      strokeWidth: 1.5,
    })));

    // --- C. TEXT LABEL ---
    const textDist = radius * 0.65;
    const tx = x + Math.cos(midAngle) * textDist;
    const ty = y + Math.sin(midAngle) * textDist * flatten;
    elements.push(`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" fill="black" font-family="sans-serif" font-weight="bold" font-size="14px" style="paint-order: stroke; stroke: white; stroke-width: 3px; pointer-events: none;">${d.label}</text>`);
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${elements.join('')}
</svg>`;
}

// Example execution:
const myData: PieData[] = [
  { label: 'PHP', value: 30, color: '#e74c3c' },     // Red
  { label: 'TS', value: 50, color: '#3498db', highlight: true }, // Blue
  { label: 'Go', value: 20, color: '#2ecc71' },      // Green
  { label: 'Py', value: 40, color: '#f1c40f' },      // Yellow
];

const svgPie3dAdvanced = generate3DPie(myData);
console.log(svgPie3dAdvanced);
