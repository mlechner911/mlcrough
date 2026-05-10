import { Op } from '../core.js';
import { GeometricContext, offsetOpt } from '../renderer-core.js';

/**
 * Generates operations for a line between two points.
 */
export function line(x1: number, y1: number, x2: number, y2: number, context: GeometricContext, move: boolean, overlay: boolean): Op[] {
  const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
  const length = Math.sqrt(lengthSq);
  let roughnessGain = 1;
  if (length < 200) {
    roughnessGain = 1;
  } else if (length > 500) {
    roughnessGain = 0.4;
  } else {
    roughnessGain = (-0.0016668) * length + 1.233334;
  }

  let off = context.options.maxRandomnessOffset || 0;
  if ((off * off * 100) > lengthSq) {
    off = length / 10;
  }
  const halfOffset = off / 2;
  const divergePoint = 0.2 + context.random() * 0.2;
  let midDispX = context.options.bowing * context.options.maxRandomnessOffset * (y2 - y1) / 200;
  let midDispY = context.options.bowing * context.options.maxRandomnessOffset * (x1 - x2) / 200;
  midDispX = offsetOpt(midDispX, context, roughnessGain);
  midDispY = offsetOpt(midDispY, context, roughnessGain);
  const ops: Op[] = [];
  const randomHalf = () => offsetOpt(halfOffset, context, roughnessGain);
  const randomFull = () => offsetOpt(off, context, roughnessGain);
  const preserveVertices = context.options.preserveVertices;
  if (move) {
    if (overlay) {
      ops.push({
        op: 'move', data: [
          x1 + (preserveVertices ? 0 : randomHalf()),
          y1 + (preserveVertices ? 0 : randomHalf()),
        ],
      });
    } else {
      ops.push({
        op: 'move', data: [
          x1 + (preserveVertices ? 0 : offsetOpt(off, context, roughnessGain)),
          y1 + (preserveVertices ? 0 : offsetOpt(off, context, roughnessGain)),
        ],
      });
    }
  }
  if (overlay) {
    ops.push({
      op: 'bcurveTo',
      data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomHalf(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomHalf(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomHalf(),
        x2 + (preserveVertices ? 0 : randomHalf()),
        y2 + (preserveVertices ? 0 : randomHalf()),
      ],
    });
  } else {
    ops.push({
      op: 'bcurveTo',
      data: [
        midDispX + x1 + (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + (y2 - y1) * divergePoint + randomFull(),
        midDispX + x1 + 2 * (x2 - x1) * divergePoint + randomFull(),
        midDispY + y1 + 2 * (y2 - y1) * divergePoint + randomFull(),
        x2 + (preserveVertices ? 0 : randomFull()),
        y2 + (preserveVertices ? 0 : randomFull()),
      ],
    });
  }
  return ops;
}

/**
 * Generates operations for a double line between two points.
 */
export function doubleLine(x1: number, y1: number, x2: number, y2: number, context: GeometricContext, filling = false): Op[] {
  const singleStroke = filling ? context.options.disableMultiStrokeFill : context.options.disableMultiStroke;
  const o1 = line(x1, y1, x2, y2, context, true, false);
  if (singleStroke) {
    return o1;
  }
  const o2 = line(x1, y1, x2, y2, context, true, true);
  return o1.concat(o2);
}
