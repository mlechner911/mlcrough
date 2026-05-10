import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

/**
 * A hachure filler that produces multiple OpSets with varying opacities.
 */
export class MultiHachureFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet[] {
    const lines = polygonHachureLines(polygonList, o);
    
    // Group lines into 3 sets with different opacities
    const groups: Op[][] = [[], [], []];
    const opacities = [0.2, 0.5, 0.8];

    lines.forEach((line, i) => {
      const groupIdx = i % 3;
      groups[groupIdx].push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    });

    return groups.map((ops, i) => ({
      type: 'fillSketch',
      ops,
      options: {
        opacity: opacities[i],
      }
    }));
  }
}
