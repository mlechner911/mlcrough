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

  /**
   * Fills polygons with multi-tone hachure lines.
   */
  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet[] {
    const lines = polygonHachureLines(polygonList, o);

    // Shuffle lines to distribute opacities randomly across the shape
    const shuffledLines = [...lines];
    const random = () => o.randomizer ? o.randomizer.next() : Math.random();
    
    for (let i = shuffledLines.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffledLines[i], shuffledLines[j]] = [shuffledLines[j], shuffledLines[i]];
    }

    const steps = 4;
    const groups: Op[][] = Array.from({ length: steps }, () => []);

    shuffledLines.forEach((line, i) => {
      const groupIdx = i % steps;
      groups[groupIdx].push(...this.helper.doubleLineOps(line[0][0], line[0][1], line[1][0], line[1][1], o));
    });

    const [min, max] = o.opacityRange || [0.3, 0.94];
    const opacitySteps = Array.from({ length: steps }, (_, i) => min + (max - min) * (i / (steps - 1)));

    return groups.map((ops, i) => ({
      type: 'fillSketch',
      ops,
      options: {
        opacity: opacitySteps[i],
      },
    }));
  }
}
