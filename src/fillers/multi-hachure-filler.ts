import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point } from '../geometry';
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

    // Shuffle lines to distribute opacities randomly across the shape
    const shuffledLines = [...lines];
    const random = () => o.randomizer ? o.randomizer.next() : Math.random();

    for (let i = shuffledLines.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffledLines[i], shuffledLines[j]] = [shuffledLines[j], shuffledLines[i]];
    }

    const opacities = [0.4, 0.5, 0.6, 0.94];
    const groups: Op[][] = opacities.map(() => []);

    shuffledLines.forEach((line, i) => {
      const groupIdx = i % opacities.length;
      groups[groupIdx].push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    });

    return groups.map((ops, i) => ({
      type: 'fillSketch',
      ops,
      options: {
        opacity: opacities[i],
      },
    }));
  }
}
