import { Op } from '../core.js';
import { Point } from '../geometry.js';
import { GeometricContext, offsetOpt } from '../renderer-core.js';
import { curve } from './curve.js';

/**
 * Generates operations for an arc.
 */
export function arc(increment: number, cx: number, cy: number, rx: number, ry: number, strt: number, stp: number, offset: number, context: GeometricContext): Op[] {
  const radOffset = strt + offsetOpt(0.1, context);
  const points: Point[] = [];
  points.push([
    offsetOpt(offset, context) + cx + 0.9 * rx * Math.cos(radOffset - increment),
    offsetOpt(offset, context) + cy + 0.9 * ry * Math.sin(radOffset - increment),
  ]);
  for (let angle = radOffset; angle <= stp; angle = angle + increment) {
    points.push([
      offsetOpt(offset, context) + cx + rx * Math.cos(angle),
      offsetOpt(offset, context) + cy + ry * Math.sin(angle),
    ]);
  }
  points.push([
    cx + rx * Math.cos(stp),
    cy + ry * Math.sin(stp),
  ]);
  points.push([
    cx + rx * Math.cos(stp),
    cy + ry * Math.sin(stp),
  ]);
  return curve(points, null, context);
}
