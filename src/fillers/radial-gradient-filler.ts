import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

/**
 * A filler that produces a radial gradient effect by varying the opacity of hachure lines
 * based on their distance from the center.
 */
export class RadialGradientFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  /**
   * Fills polygons with hachure lines that fade in opacity radially from the center.
   */
  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet[] {
    const lines = polygonHachureLines(polygonList, o);
    if (!lines.length) {
      return [];
    }

    // 1. Calculate bounding box and center
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    polygonList.forEach(poly => {
      poly.forEach(p => {
        minX = Math.min(minX, p[0]);
        minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]);
        maxY = Math.max(maxY, p[1]);
      });
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const maxDist = Math.sqrt(Math.pow(maxX - centerX, 2) + Math.pow(maxY - centerY, 2)) || 1;

    // 2. Group lines into opacity steps based on distance
    const steps = 10;
    const groups: Op[][] = Array.from({ length: steps }, () => []);
    const groupDistances: number[] = Array.from({ length: steps }, () => 0);
    const groupCounts: number[] = Array.from({ length: steps }, () => 0);

    lines.forEach((line) => {
      // Midpoint of the line
      const mx = (line[0][0] + line[1][0]) / 2;
      const my = (line[0][1] + line[1][1]) / 2;
      const dist = Math.sqrt(Math.pow(mx - centerX, 2) + Math.pow(my - centerY, 2));
      const relDist = Math.min(1, dist / maxDist);
      
      const groupIdx = Math.min(steps - 1, Math.floor(relDist * steps));
      groups[groupIdx].push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
      groupDistances[groupIdx] += relDist;
      groupCounts[groupIdx]++;
    });

    return groups.map((ops, i): OpSet | null => {
      if (ops.length === 0) return null;
      const avgRelDist = groupDistances[i] / groupCounts[i];
      return {
        type: 'fillSketch',
        ops,
        options: {
          opacity: Math.max(0.1, 1 - avgRelDist), // Brighter at center, fades at edges
        },
      };
    }).filter((res): res is OpSet => res !== null);
  }
}
