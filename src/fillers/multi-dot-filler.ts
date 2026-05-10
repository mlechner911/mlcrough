import { PatternFiller, RenderHelper } from './filler-interface';
import { ResolvedOptions, OpSet, Op } from '../core';
import { Point, Line, lineLength } from '../geometry';
import { polygonHachureLines } from './scan-line-hachure';

/**
 * A filler that produces a dotted pattern with randomized opacities.
 */
export class MultiDotFiller implements PatternFiller {
  private helper: RenderHelper;

  constructor(helper: RenderHelper) {
    this.helper = helper;
  }

  /**
   * Fills polygons with dots of varying opacities for a more organic look.
   */
  fillPolygons(polygonList: Point[][], o: ResolvedOptions): OpSet[] {
    o = Object.assign({}, o, { hachureAngle: 0 });
    const lines = polygonHachureLines(polygonList, o);
    return this.dotsOnLines(lines, o);
  }

  private dotsOnLines(lines: Line[], o: ResolvedOptions): OpSet[] {
    const steps = 4;
    const groups: Op[][] = Array.from({ length: steps }, () => []);

    let gap = o.hachureGap;
    if (gap < 0) {
      gap = o.strokeWidth * 4;
    }
    gap = Math.max(gap, 0.1);
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    const ro = gap / 4;
    
    const random = () => o.randomizer ? o.randomizer.next() : Math.random();

    for (const line of lines) {
      const length = lineLength(line);
      const dl = length / gap;
      const count = Math.ceil(dl) - 1;
      const offset = length - (count * gap);
      const x = ((line[0][0] + line[1][0]) / 2) - (gap / 4);
      const minY = Math.min(line[0][1], line[1][1]);

      for (let i = 0; i < count; i++) {
        const y = minY + offset + (i * gap);
        const cx = (x - ro) + random() * 2 * ro;
        const cy = (y - ro) + random() * 2 * ro;
        const el = this.helper.ellipse(cx, cy, fweight, fweight, o);
        
        // Randomly assign to an opacity group
        const groupIdx = Math.floor(random() * steps);
        groups[groupIdx].push(...el.ops);
      }
    }

    const [min, max] = o.opacityRange || [0.3, 0.9];
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
