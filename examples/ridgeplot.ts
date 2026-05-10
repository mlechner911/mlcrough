import mlcrough from '../src/mlcrough.js';

interface SeriesData {
  label: string;
  values: number[];
  color: string;
}

interface RidgeOptions {
  width?: number;
  height?: number;
  depthOffset?: number;
  stepX?: number;
  thickness?: number;
}

/**
 * Demonstrates an isometric 3D Area Chart (Ridge Plot / Joyplot).
 * Uses the Painter's Algorithm to draw series from back to front.
 */
function generate3DAreaChart(datasets: SeriesData[], options: RidgeOptions = {}): string {
  const {
    width = 800,
    height = 500,
    depthOffset = 40,
    stepX = 60,
    thickness = 15,
  } = options;

  const rc = mlcrough.svgString();
  const elements: string[] = [];

  // Painter's Algorithm: Draw from back to front
  const reversedData = [...datasets].reverse();

  reversedData.forEach((series, sIndex) => {
    // Offset for each layer to create depth
    const layerIdx = datasets.length - 1 - sIndex;
    const offX = layerIdx * depthOffset + 50;
    const offY = layerIdx * depthOffset * 0.5;

    const points: [number, number][] = [];
    const baseline = height - 100 - offY;

    // 1. Calculate points for the series ridge
    series.values.forEach((v, i) => {
      points.push([offX + i * stepX, baseline - v]);
    });

    // --- A. THE VOLUMETRIC RIDGE CAP (Top surface) ---
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      
      const ridgePath = `M ${p1[0]} ${p1[1]} 
                         L ${p2[0]} ${p2[1]} 
                         L ${p2[0] + thickness} ${p2[1] - thickness * 0.5} 
                         L ${p1[0] + thickness} ${p1[1] - thickness * 0.5} Z`;
      
      // Masking (Make it opaque)
      elements.push(mlcrough.serialize(rc.path(ridgePath, {
        fill: 'white', fillStyle: 'solid', stroke: 'none',
      })));
      // Top surface shadow/accent
      elements.push(mlcrough.serialize(rc.path(ridgePath, {
        fill: series.color, 
        fillStyle: 'solid', 
        opacity: 0.4, 
        stroke: '#333', 
        strokeWidth: 0.5,
      })));
    }

    // --- B. THE FRONT FACE (The "Mountain Body") ---
    const frontPath = `M ${points[0][0]} ${baseline} ` + 
                      points.map((p) => `L ${p[0]} ${p[1]}`).join(' ') + 
                      ` L ${points[points.length - 1][0]} ${baseline} Z`;

    // Masking
    elements.push(mlcrough.serialize(rc.path(frontPath, { fill: 'white', fillStyle: 'solid', stroke: 'none' })));
    
    // Front face with hachure
    elements.push(mlcrough.serialize(rc.path(frontPath, {
      fill: series.color,
      fillStyle: 'hachure',
      hachureAngle: 60 + (sIndex * 15),
      hachureGap: 4 + (layerIdx * 0.5), // Back layers are slightly denser
      stroke: '#000',
      strokeWidth: 1.5,
    })));

    // --- C. SERIES LABEL ---
    elements.push(`
      <text x="${points[0][0] - 10}" y="${baseline}" text-anchor="end" dominant-baseline="middle" 
            fill="#555" font-family="sans-serif" font-weight="bold" font-size="12px">
        ${series.label}
      </text>`);
  });

  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mistGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#eef2f3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#mistGradient)" />
  ${elements.join('\n  ')}
</svg>
  `.trim();
}

// Example Data
const mountains: SeriesData[] = [
  { label: 'West', values: [40, 90, 60, 120, 80, 100], color: '#e74c3c' },
  { label: 'North', values: [30, 80, 40, 100, 50, 90], color: '#3498db' },
  { label: 'South', values: [50, 30, 90, 40, 70, 40], color: '#2ecc71' },
];

const svgRidge = generate3DAreaChart(mountains);
console.log(svgRidge);
