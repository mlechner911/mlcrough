import { ResolvedOptions, FillStyle } from '../core';
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

const fillers: Partial<Record<FillStyle, PatternFiller>> = {};

export function getFiller(o: ResolvedOptions, helper: RenderHelper): PatternFiller {
  let fillerName: FillStyle = o.fillStyle || 'hachure';
  if (!fillers[fillerName]) {
    switch (fillerName) {
      case 'zigzag':
        fillers[fillerName] = new ZigZagFiller(helper);
        break;
      case 'cross-hatch':
        fillers[fillerName] = new HatchFiller(helper);
        break;
      case 'dots':
        fillers[fillerName] = new DotFiller(helper);
        break;
      case 'dashed':
        fillers[fillerName] = new DashedFiller(helper);
        break;
      case 'zigzag-line':
        fillers[fillerName] = new ZigZagLineFiller(helper);
        break;
      case 'multi-hachure':
        fillers[fillerName] = new MultiHachureFiller(helper);
        break;
      case 'gradient':
        fillers[fillerName] = new GradientFiller(helper);
        break;
      case 'radial-gradient':
        fillers[fillerName] = new RadialGradientFiller(helper);
        break;
      case 'solid':
      case 'hachure':
      default:
        fillerName = 'hachure';
        if (!fillers[fillerName]) {
          fillers[fillerName] = new HachureFiller(helper);
        }
        break;
    }
  }
  return fillers[fillerName] as PatternFiller;
}