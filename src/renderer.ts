import { ResolvedOptions, Op, OpSet } from './core.js';
import { Point } from './geometry.js';
import { getFiller } from './fillers/filler.js';
import { RenderHelper } from './fillers/filler-interface.js';
import * as pdp_module from 'path-data-parser';
import { GeometricContext, createGeometricContext, offset, offsetOpt } from './renderer-core.js';
import { doubleLine } from './shapes/line.js';
import { curve, curveWithOffset, bezierTo } from './shapes/curve.js';
import { computeEllipsePoints } from './shapes/ellipse.js';
import { arc } from './shapes/arc.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdp: any = pdp_module;
const parsePath = pdp.parsePath || pdp.default?.parsePath;
const normalize = pdp.normalize || pdp.default?.normalize;
const absolutize = pdp.absolutize || pdp.default?.absolutize;

/**
 * Parameters for an ellipse.
 */
export interface EllipseParams {
  rx: number;
  ry: number;
  increment: number;
}

/**
 * Result of an ellipse drawing operation.
 */
export interface EllipseResult {
  opset: OpSet;
  estimatedPoints: Point[];
}

/**
 * The MLCRoughRenderer class handles the low-level drawing of shapes using hand-drawn style algorithms.
 */
export class MLCRoughRenderer implements RenderHelper {
  private ctx: GeometricContext;

  constructor(o: ResolvedOptions) {
    this.ctx = createGeometricContext(o);
  }

  /**
   * Generates operations for a line.
   */
  line(x1: number, y1: number, x2: number, y2: number): OpSet {
    return { type: 'path', ops: doubleLine(x1, y1, x2, y2, this.ctx) };
  }

  /**
   * Generates operations for a linear path.
   */
  linearPath(points: Point[], close: boolean): OpSet {
    const len = (points || []).length;
    if (len > 2) {
      const ops: Op[] = [];
      for (let i = 0; i < (len - 1); i++) {
        ops.push(...doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], this.ctx));
      }
      if (close) {
        ops.push(...doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1], this.ctx));
      }
      return { type: 'path', ops };
    } else if (len === 2) {
      return this.line(points[0][0], points[0][1], points[1][0], points[1][1]);
    }
    return { type: 'path', ops: [] };
  }

  /**
   * Generates operations for a polygon.
   */
  polygon(points: Point[]): OpSet {
    return this.linearPath(points, true);
  }

  /**
   * Generates operations for a rectangle.
   */
  rectangle(x: number, y: number, width: number, height: number): OpSet {
    const points: Point[] = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
    return this.polygon(points);
  }

  /**
   * Generates operations for a curve.
   */
  curve(inputPoints: Point[] | Point[][]): OpSet {
    if (inputPoints.length) {
      const p1 = inputPoints[0];
      const pointsList = (typeof p1[0] === 'number') ? [inputPoints as Point[]] : inputPoints as Point[][];

      const o1 = curveWithOffset(pointsList[0], 1 * (1 + this.ctx.options.roughness * 0.2), this.ctx);
      const o2 = this.ctx.options.disableMultiStroke ? [] : curveWithOffset(pointsList[0], 1.5 * (1 + this.ctx.options.roughness * 0.22), this.cloneOptionsAlterSeed(this.ctx));

      for (let i = 1; i < pointsList.length; i++) {
        const points = pointsList[i];
        if (points.length) {
          const underlay = curveWithOffset(points, 1 * (1 + this.ctx.options.roughness * 0.2), this.ctx);
          const overlay = this.ctx.options.disableMultiStroke ? [] : curveWithOffset(points, 1.5 * (1 + this.ctx.options.roughness * 0.22), this.cloneOptionsAlterSeed(this.ctx));
          for (const item of underlay) {
            if (item.op !== 'move') {
              o1.push(item);
            }
          }
          for (const item of overlay) {
            if (item.op !== 'move') {
              o2.push(item);
            }
          }
        }
      }

      return { type: 'path', ops: o1.concat(o2) };
    }
    return { type: 'path', ops: [] };
  }

  /**
   * Generates operations for an ellipse.
   */
  ellipse(x: number, y: number, width: number, height: number): OpSet {
    const params = this.generateEllipseParams(width, height);
    return this.ellipseWithParams(x, y, params).opset;
  }

  /**
   * Generates parameters for an ellipse.
   */
  generateEllipseParams(width: number, height: number): EllipseParams {
    const psq = Math.sqrt(Math.PI * 2 * Math.sqrt((Math.pow(width / 2, 2) + Math.pow(height / 2, 2)) / 2));
    const stepCount = Math.ceil(Math.max(this.ctx.options.curveStepCount, (this.ctx.options.curveStepCount / Math.sqrt(200)) * psq));
    const increment = (Math.PI * 2) / stepCount;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    const curveFitRandomness = 1 - this.ctx.options.curveFitting;
    rx += offsetOpt(rx * curveFitRandomness, this.ctx);
    ry += offsetOpt(ry * curveFitRandomness, this.ctx);
    return { increment, rx, ry };
  }

  /**
   * Generates operations for an ellipse using provided parameters.
   */
  ellipseWithParams(x: number, y: number, ellipseParams: EllipseParams): EllipseResult {
    const [ap1, cp1] = computeEllipsePoints(ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, 1, ellipseParams.increment * offset(0.1, offset(0.4, 1, this.ctx), this.ctx), this.ctx);
    let o1 = curve(ap1, null, this.ctx);
    if ((!this.ctx.options.disableMultiStroke) && (this.ctx.options.roughness !== 0)) {
      const [ap2] = computeEllipsePoints(ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, 1.5, 0, this.ctx);
      const o2 = curve(ap2, null, this.ctx);
      o1 = o1.concat(o2);
    }
    return {
      estimatedPoints: cp1,
      opset: { type: 'path', ops: o1 },
    };
  }

  /**
   * Generates operations for an arc.
   */
  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean): OpSet {
    const cx = x;
    const cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += offsetOpt(rx * 0.01, this.ctx);
    ry += offsetOpt(ry * 0.01, this.ctx);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    const ellipseInc = (Math.PI * 2) / this.ctx.options.curveStepCount;
    const arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
    const ops = arc(arcInc, cx, cy, rx, ry, strt, stp, 1, this.ctx);
    if (!this.ctx.options.disableMultiStroke) {
      const o2 = arc(arcInc, cx, cy, rx, ry, strt, stp, 1.5, this.ctx);
      ops.push(...o2);
    }
    if (closed) {
      if (roughClosure) {
        ops.push(
          ...doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt), this.ctx),
          ...doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp), this.ctx),
        );
      } else {
        ops.push(
          { op: 'lineTo', data: [cx, cy] },
          { op: 'lineTo', data: [cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)] },
        );
      }
    }
    return { type: 'path', ops };
  }

  /**
   * Generates operations for an SVG path.
   */
  svgPath(path: string): OpSet {
    const segments = normalize(absolutize(parsePath(path)));
    const ops: Op[] = [];
    let first: Point = [0, 0];
    let current: Point = [0, 0];
    for (const { key, data } of segments) {
      switch (key) {
        case 'M': {
          current = [data[0], data[1]];
          first = [data[0], data[1]];
          break;
        }
        case 'L':
          ops.push(...doubleLine(current[0], current[1], data[0], data[1], this.ctx));
          current = [data[0], data[1]];
          break;
        case 'C': {
          const [x1, y1, x2, y2, x, y] = data;
          ops.push(...bezierTo(x1, y1, x2, y2, x, y, current, this.ctx));
          current = [x, y];
          break;
        }
        case 'Z':
          ops.push(...doubleLine(current[0], current[1], first[0], first[1], this.ctx));
          current = [first[0], first[1]];
          break;
      }
    }
    return { type: 'path', ops };
  }

  /**
   * Generates operations for a solid fill polygon.
   */
  solidFillPolygon(polygonList: Point[][]): OpSet {
    const ops: Op[] = [];
    for (const points of polygonList) {
      if (points.length) {
        const off = this.ctx.options.maxRandomnessOffset || 0;
        const len = points.length;
        if (len > 2) {
          ops.push({ op: 'move', data: [points[0][0] + offsetOpt(off, this.ctx), points[0][1] + offsetOpt(off, this.ctx)] });
          for (let i = 1; i < len; i++) {
            ops.push({ op: 'lineTo', data: [points[i][0] + offsetOpt(off, this.ctx), points[i][1] + offsetOpt(off, this.ctx)] });
          }
        }
      }
    }
    return { type: 'fillPath', ops };
  }

  /**
   * Generates operations for a pattern fill polygon.
   */
  patternFillPolygons(polygonList: Point[][]): OpSet {
    return getFiller(this.ctx.options, this).fillPolygons(polygonList, this.ctx.options);
  }

  /**
   * Generates operations for a pattern fill arc.
   */
  patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number): OpSet {
    const cx = x;
    const cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += offsetOpt(rx * 0.01, this.ctx);
    ry += offsetOpt(ry * 0.01, this.ctx);
    let strt = start;
    let stp = stop;
    while (strt < 0) {
      strt += Math.PI * 2;
      stp += Math.PI * 2;
    }
    if ((stp - strt) > (Math.PI * 2)) {
      strt = 0;
      stp = Math.PI * 2;
    }
    const increment = (stp - strt) / this.ctx.options.curveStepCount;
    const points: Point[] = [];
    for (let angle = strt; angle <= stp; angle = angle + increment) {
      points.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
    }
    points.push([cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)]);
    points.push([cx, cy]);
    return this.patternFillPolygons([points]);
  }

  // RenderHelper implementation

  randOffset(x: number): number {
    return offsetOpt(x, this.ctx);
  }

  randOffsetWithRange(min: number, max: number): number {
    return offset(min, max, this.ctx);
  }

  doubleLineOps(x1: number, y1: number, x2: number, y2: number): Op[] {
    return doubleLine(x1, y1, x2, y2, this.ctx, true);
  }

  // Private helpers

  private cloneOptionsAlterSeed(context: GeometricContext): GeometricContext {
    const result: ResolvedOptions = { ...context.options };
    result.randomizer = undefined;
    if (context.options.seed) {
      result.seed = context.options.seed + 1;
    }
    return createGeometricContext(result);
  }
}
