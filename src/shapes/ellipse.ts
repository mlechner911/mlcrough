import { Point } from '../geometry.js';
import { GeometricContext, offsetOpt } from '../renderer-core.js';

/**
 * Computes points for an ellipse.
 */
export function computeEllipsePoints(increment: number, cx: number, cy: number, rx: number, ry: number, offset: number, overlap: number, context: GeometricContext): Point[][] {
  const coreOnly = context.options.roughness === 0;
  const corePoints: Point[] = [];
  const allPoints: Point[] = [];

  if (coreOnly) {
    increment = increment / 4;
    allPoints.push([
      cx + rx * Math.cos(-increment),
      cy + ry * Math.sin(-increment),
    ]);
    for (let angle = 0; angle <= Math.PI * 2; angle = angle + increment) {
      const p: Point = [
        cx + rx * Math.cos(angle),
        cy + ry * Math.sin(angle),
      ];
      corePoints.push(p);
      allPoints.push(p);
    }
    allPoints.push([
      cx + rx * Math.cos(0),
      cy + ry * Math.sin(0),
    ]);
    allPoints.push([
      cx + rx * Math.cos(increment),
      cy + ry * Math.sin(increment),
    ]);
  } else {
    const radOffset = offsetOpt(0.5, context) - (Math.PI / 2);
    allPoints.push([
      offsetOpt(offset, context) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      offsetOpt(offset, context) + cy + 0.9 * ry * Math.sin(radOffset - increment),
    ]);
    const endAngle = Math.PI * 2 + radOffset - 0.01;
    for (let angle = radOffset; angle < endAngle; angle = angle + increment) {
      const p: Point = [
        offsetOpt(offset, context) + cx + rx * Math.cos(angle),
        offsetOpt(offset, context) + cy + ry * Math.sin(angle),
      ];
      corePoints.push(p);
      allPoints.push(p);
    }
    allPoints.push([
      offsetOpt(offset, context) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
      offsetOpt(offset, context) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5),
    ]);
    allPoints.push([
      offsetOpt(offset, context) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
      offsetOpt(offset, context) + cy + 0.98 * ry * Math.sin(radOffset + overlap),
    ]);
    allPoints.push([
      offsetOpt(offset, context) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
      offsetOpt(offset, context) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5),
    ]);
  }

  return [allPoints, corePoints];
}
