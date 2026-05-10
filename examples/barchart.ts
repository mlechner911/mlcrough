import mlcrough from '../src/mlcrough.js';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface ChartOptions {
  width?: number;
  height?: number;
  depth?: number;
  padding?: number;
  barGap?: number;
}

/**
 * Demonstrates how to create a 3D bar chart using MLCRough.
 * This example uses the svgString renderer.
 */
function create3DBarChart(data: ChartData[], options: ChartOptions = {}): string {
  const {
    width = 600,
    height = 400,
    depth = 20,
    padding = 50,
    barGap = 20,
  } = options;

  const rc = mlcrough.svgString();
  const maxVal = Math.max(...data.map((d) => d.value));
  const chartWidth = width - padding * 2 - depth;
  const chartHeight = height - padding * 2 - depth;
  const barWidth = (chartWidth / data.length) - barGap;

  const getY = (val: number) => (height - padding) - (val / maxVal * chartHeight);
  const getX = (i: number) => padding + i * (barWidth + barGap);

  const elements: string[] = [];

  data.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.value);
    const baseline = height - padding;

    // --- A. TOP (Deckel) ---
    const top = rc.polygon([
      [x, y],
      [x + depth, y - depth],
      [x + barWidth + depth, y - depth],
      [x + barWidth, y],
    ], {
      fill: d.color || '#4A90E2',
      fillStyle: 'solid',
    });
    elements.push(mlcrough.serialize(top));

    // --- B. SIDE (Rechte Wand) ---
    const side = rc.polygon([
      [x + barWidth, y],
      [x + barWidth + depth, y - depth],
      [x + barWidth + depth, baseline - depth],
      [x + barWidth, baseline],
    ], {
      fill: 'rgba(0,0,0,0.2)',
      fillStyle: 'solid',
    });
    elements.push(mlcrough.serialize(side));

    // --- C. FRONT (Hauptfläche) ---
    const front = rc.rectangle(x, y, barWidth, baseline - y, {
      fill: d.color || '#4A90E2',
      hachureAngle: 60,
      hachureGap: 4,
    });
    elements.push(mlcrough.serialize(front));

    // --- D. LABEL (Text-Placeholder) ---
    // Note: MLCRough does not handle text, so we use standard SVG text tags.
    elements.push(`<text x="${x + barWidth / 2}" y="${baseline + 20}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#333">${d.label}</text>`);

    // --- E. VALUE LABEL (Above the lid) ---
    const labelX = x + (barWidth / 2) + (depth / 2);
    const labelY = y - depth - 8;
    elements.push(`<text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="cursive, sans-serif" font-weight="bold" font-size="14" fill="#333">${d.value}</text>`);
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  ${elements.join('')}
</svg>`;
}

// Example execution:
const myData: ChartData[] = [
  { label: 'Jan', value: 45, color: '#e74c3c' },
  { label: 'Feb', value: 80, color: '#3498db' },
  { label: 'Mär', value: 32, color: '#2ecc71' },
  { label: 'Apr', value: 65, color: '#f1c40f' },
  { label: 'Mai', value: 55, color: '#9b59b6' },
];

const svgChart = create3DBarChart(myData);
console.log(svgChart);
