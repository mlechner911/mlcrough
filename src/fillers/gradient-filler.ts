import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

/**
 * A filler that produces a linear gradient effect by varying the opacity of hachure lines.
 */
export class GradientFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  /**
   * Fills polygons with hachure lines that fade in opacity linearly.
   */
  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet[] {
    const lines = polygonHachureLines(polygonList, o);
    if (!lines.length) {
      return [];
    }

    // We group lines into 10 opacity steps for performance
    const steps = 10;
    const groups: Op[][] = Array.from({ length: steps }, () => []);
    
    lines.forEach((line, i) => {
      // Relative position from 0 to 1
      const rel = i / (lines.length - 1 || 1);
      const groupIdx = Math.min(steps - 1, Math.floor(rel * steps));
      
      groups[groupIdx].push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    });

    const [min, max] = o.opacityRange || [0.1, 1.0];

    return groups.filter(ops => ops.length > 0).map((ops, i) => {
      // Find the average relative position of this group to determine its opacity
      const rel = i / (groups.length - 1 || 1);
      return {
        type: 'fillSketch',
        ops,
        options: {
          opacity: max - (rel * (max - min)), // Fade from max to min
        },
      };
    });
  }
}
