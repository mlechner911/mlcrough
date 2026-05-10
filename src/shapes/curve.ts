import { Op } from '../core.js';
import { Point } from '../geometry.js';
import { GeometricContext, offsetOpt } from '../renderer-core.js';
import { line } from './line.js';

/**
 * Generates operations for a curve through a series of points.
 */
export function curve(points: Point[], closePoint: Point | null, context: GeometricContext): Op[] {
  const len = points.length;
  const ops: Op[] = [];
  if (len > 3) {
    const b = [];
    const s = 1 - context.options.curveTightness;
    ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
    for (let i = 1; (i + 2) < len; i++) {
      const cachedVertArray = points[i];
      b[0] = [cachedVertArray[0], cachedVertArray[1]];
      b[1] = [cachedVertArray[0] + (s * points[i + 1][0] - s * points[i - 1][0]) / 6, cachedVertArray[1] + (s * points[i + 1][1] - s * points[i - 1][1]) / 6];
      b[2] = [points[i + 1][0] + (s * points[i][0] - s * points[i + 2][0]) / 6, points[i + 1][1] + (s * points[i][1] - s * points[i + 2][1]) / 6];
      b[3] = [points[i + 1][0], points[i + 1][1]];
      ops.push({ op: 'bcurveTo', data: [b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]] });
    }
    if (closePoint && closePoint.length === 2) {
      const ro = context.options.maxRandomnessOffset;
      ops.push({ op: 'lineTo', data: [closePoint[0] + offsetOpt(ro, context), closePoint[1] + offsetOpt(ro, context)] });
    }
  } else if (len === 3) {
    ops.push({ op: 'move', data: [points[1][0], points[1][1]] });
    ops.push({
      op: 'bcurveTo',
      data: [
        points[1][0], points[1][1],
        points[2][0], points[2][1],
        points[2][0], points[2][1],
      ],
    });
  } else if (len === 2) {
    ops.push(...line(points[0][0], points[0][1], points[1][0], points[1][1], context, true, true));
  }
  return ops;
}

/**
 * Generates operations for a curve with an offset.
 */
export function curveWithOffset(points: Point[], offset: number, context: GeometricContext): Op[] {
  if (!points.length) {
    return [];
  }
  const ps: Point[] = [];
  ps.push([
    points[0][0] + offsetOpt(offset, context),
    points[0][1] + offsetOpt(offset, context),
  ]);
  ps.push([
    points[0][0] + offsetOpt(offset, context),
    points[0][1] + offsetOpt(offset, context),
  ]);
  for (let i = 1; i < points.length; i++) {
    ps.push([
      points[i][0] + offsetOpt(offset, context),
      points[i][1] + offsetOpt(offset, context),
    ]);
    if (i === (points.length - 1)) {
      ps.push([
        points[i][0] + offsetOpt(offset, context),
        points[i][1] + offsetOpt(offset, context),
      ]);
    }
  }
  return curve(ps, null, context);
}

/**
 * Generates operations for a Bezier curve to a point.
 */
export function bezierTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number, current: Point, context: GeometricContext): Op[] {
  const ops: Op[] = [];
  const ros = [context.options.maxRandomnessOffset || 1, (context.options.maxRandomnessOffset || 1) + 0.3];
  let f: Point = [0, 0];
  const iterations = context.options.disableMultiStroke ? 1 : 2;
  const preserveVertices = context.options.preserveVertices;
  for (let i = 0; i < iterations; i++) {
    if (i === 0) {
      ops.push({ op: 'move', data: [current[0], current[1]] });
    } else {
      ops.push({ op: 'move', data: [current[0] + (preserveVertices ? 0 : offsetOpt(ros[0], context)), current[1] + (preserveVertices ? 0 : offsetOpt(ros[0], context))] });
    }
    f = preserveVertices ? [x, y] : [x + offsetOpt(ros[i], context), y + offsetOpt(ros[i], context)];
    ops.push({
      op: 'bcurveTo',
      data: [
        x1 + offsetOpt(ros[i], context), y1 + offsetOpt(ros[i], context),
        x2 + offsetOpt(ros[i], context), y2 + offsetOpt(ros[i], context),
        f[0], f[1],
      ],
    });
  }
  return ops;
}
