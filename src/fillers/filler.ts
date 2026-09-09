import { ResolvedOptions } from '../core';
import { PatternFiller, RenderHelper } from './filler-interface';
import { HachureFiller } from './hachure-filler';
import { ZigZagFiller } from './zigzag-filler';
import { HatchFiller } from './hatch-filler';
import { DotFiller } from './dot-filler';
import { DashedFiller } from './dashed-filler';
import { ZigZagLineFiller } from './zigzag-line-filler';
import { MultiHachureFiller } from './multi-hachure-filler';
import { GradientFiller } from './gradient-filler';
import { RadialGradientFiller } from './radial-gradient-filler';
import { MultiDotFiller } from './multi-dot-filler';

/**
 * Returns the filler for a fill style.
 *
 * A filler is built fresh every time, deliberately. It holds the render helper
 * it was given, and that helper carries the randomizer for one particular
 * drawing operation — so a cached filler would keep handing every later shape
 * the randomizer of whichever shape happened to be drawn first. The outlines
 * stayed reproducible, the fills did not, and `seed` quietly stopped governing
 * them. The objects are trivial; building one per fill costs nothing next to
 * the geometry it goes on to compute.
 */
export function getFiller(o: ResolvedOptions, helper: RenderHelper): PatternFiller {
  switch (o.fillStyle) {
    case 'zigzag': return new ZigZagFiller(helper);
    case 'cross-hatch': return new HatchFiller(helper);
    case 'dots': return new DotFiller(helper);
    case 'multi-dots': return new MultiDotFiller(helper);
    case 'dashed': return new DashedFiller(helper);
    case 'zigzag-line': return new ZigZagLineFiller(helper);
    case 'multi-hachure': return new MultiHachureFiller(helper);
    case 'gradient': return new GradientFiller(helper);
    case 'radial-gradient': return new RadialGradientFiller(helper);
    case 'solid':
    case 'hachure':
    default: return new HachureFiller(helper);
  }
}