import { ResolvedOptions, Op, OpSet } from './core.js';
import { Point } from './geometry.js';
import { getFiller } from './fillers/filler.js';
import { RenderHelper } from './fillers/filler-interface.js';
import { Random } from './math.js';
import * as pdp_module from 'path-data-parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdp: any = pdp_module;
const parsePath = pdp.parsePath || pdp.default?.parsePath;
const normalize = pdp.normalize || pdp.default?.normalize;
const absolutize = pdp.absolutize || pdp.default?.absolutize;

export interface EllipseParams {
  rx: number;
  ry: number;
  increment: number;
}

export interface EllipseResult {
  opset: OpSet;
  estimatedPoints: Point[];
}

export class RoughRenderer implements RenderHelper {
  private options: ResolvedOptions;

  constructor(o: ResolvedOptions) {
    this.options = o;
    if (!this.options.randomizer) {
      this.options.randomizer = new Random(this.options.seed || 0);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number): OpSet {
    return { type: 'path', ops: this.doubleLine(x1, y1, x2, y2) };
  }

  linearPath(points: Point[], close: boolean): OpSet {
    const len = (points || []).length;
    if (len > 2) {
      const ops: Op[] = [];
      for (let i = 0; i < (len - 1); i++) {
        ops.push(...this.doubleLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]));
      }
      if (close) {
        ops.push(...this.doubleLine(points[len - 1][0], points[len - 1][1], points[0][0], points[0][1]));
      }
      return { type: 'path', ops };
    } else if (len === 2) {
      return this.line(points[0][0], points[0][1], points[1][0], points[1][1]);
    }
    return { type: 'path', ops: [] };
  }

  polygon(points: Point[]): OpSet {
    return this.linearPath(points, true);
  }

  rectangle(x: number, y: number, width: number, height: number): OpSet {
    const points: Point[] = [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
    return this.polygon(points);
  }

  curve(inputPoints: Point[] | Point[][]): OpSet {
    if (inputPoints.length) {
      const p1 = inputPoints[0];
      const pointsList = (typeof p1[0] === 'number') ? [inputPoints as Point[]] : inputPoints as Point[][];

      const o1 = this.curveWithOffset(pointsList[0], 1 * (1 + this.options.roughness * 0.2));
      const o2 = this.options.disableMultiStroke ? [] : this.curveWithOffset(pointsList[0], 1.5 * (1 + this.options.roughness * 0.22), this.cloneOptionsAlterSeed(this.options));

      for (let i = 1; i < pointsList.length; i++) {
        const points = pointsList[i];
        if (points.length) {
          const underlay = this.curveWithOffset(points, 1 * (1 + this.options.roughness * 0.2));
          const overlay = this.options.disableMultiStroke ? [] : this.curveWithOffset(points, 1.5 * (1 + this.options.roughness * 0.22), this.cloneOptionsAlterSeed(this.options));
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

  ellipse(x: number, y: number, width: number, height: number): OpSet {
    const params = this.generateEllipseParams(width, height);
    return this.ellipseWithParams(x, y, params).opset;
  }

  generateEllipseParams(width: number, height: number): EllipseParams {
    const psq = Math.sqrt(Math.PI * 2 * Math.sqrt((Math.pow(width / 2, 2) + Math.pow(height / 2, 2)) / 2));
    const stepCount = Math.ceil(Math.max(this.options.curveStepCount, (this.options.curveStepCount / Math.sqrt(200)) * psq));
    const increment = (Math.PI * 2) / stepCount;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    const curveFitRandomness = 1 - this.options.curveFitting;
    rx += this.offsetOpt(rx * curveFitRandomness);
    ry += this.offsetOpt(ry * curveFitRandomness);
    return { increment, rx, ry };
  }

  ellipseWithParams(x: number, y: number, ellipseParams: EllipseParams): EllipseResult {
    const [ap1, cp1] = this.computeEllipsePoints(ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, 1, ellipseParams.increment * this.offset(0.1, this.offset(0.4, 1)));
    let o1 = this.curveHelper(ap1, null, this.options);
    if ((!this.options.disableMultiStroke) && (this.options.roughness !== 0)) {
      const [ap2] = this.computeEllipsePoints(ellipseParams.increment, x, y, ellipseParams.rx, ellipseParams.ry, 1.5, 0);
      const o2 = this.curveHelper(ap2, null, this.options);
      o1 = o1.concat(o2);
    }
    return {
      estimatedPoints: cp1,
      opset: { type: 'path', ops: o1 },
    };
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean, roughClosure: boolean): OpSet {
    const cx = x;
    const cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this.offsetOpt(rx * 0.01);
    ry += this.offsetOpt(ry * 0.01);
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
    const ellipseInc = (Math.PI * 2) / this.options.curveStepCount;
    const arcInc = Math.min(ellipseInc / 2, (stp - strt) / 2);
    const ops = this.arcHelper(arcInc, cx, cy, rx, ry, strt, stp, 1);
    if (!this.options.disableMultiStroke) {
      const o2 = this.arcHelper(arcInc, cx, cy, rx, ry, strt, stp, 1.5);
      ops.push(...o2);
    }
    if (closed) {
      if (roughClosure) {
        ops.push(
          ...this.doubleLine(cx, cy, cx + rx * Math.cos(strt), cy + ry * Math.sin(strt)),
          ...this.doubleLine(cx, cy, cx + rx * Math.cos(stp), cy + ry * Math.sin(stp)),
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
          ops.push(...this.doubleLine(current[0], current[1], data[0], data[1]));
          current = [data[0], data[1]];
          break;
        case 'C': {
          const [x1, y1, x2, y2, x, y] = data;
          ops.push(...this.bezierTo(x1, y1, x2, y2, x, y, current));
          current = [x, y];
          break;
        }
        case 'Z':
          ops.push(...this.doubleLine(current[0], current[1], first[0], first[1]));
          current = [first[0], first[1]];
          break;
      }
    }
    return { type: 'path', ops };
  }

  solidFillPolygon(polygonList: Point[][]): OpSet {
    const ops: Op[] = [];
    for (const points of polygonList) {
      if (points.length) {
        const offset = this.options.maxRandomnessOffset || 0;
        const len = points.length;
        if (len > 2) {
          ops.push({ op: 'move', data: [points[0][0] + this.offsetOpt(offset), points[0][1] + this.offsetOpt(offset)] });
          for (let i = 1; i < len; i++) {
            ops.push({ op: 'lineTo', data: [points[i][0] + this.offsetOpt(offset), points[i][1] + this.offsetOpt(offset)] });
          }
        }
      }
    }
    return { type: 'fillPath', ops };
  }

  patternFillPolygons(polygonList: Point[][]): OpSet {
    return getFiller(this.options, this).fillPolygons(polygonList, this.options);
  }

  patternFillArc(x: number, y: number, width: number, height: number, start: number, stop: number): OpSet {
    const cx = x;
    const cy = y;
    let rx = Math.abs(width / 2);
    let ry = Math.abs(height / 2);
    rx += this.offsetOpt(rx * 0.01);
    ry += this.offsetOpt(ry * 0.01);
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
    const increment = (stp - strt) / this.options.curveStepCount;
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
    return this.offsetOpt(x);
  }

  randOffsetWithRange(min: number, max: number): number {
    return this.offset(min, max);
  }

  doubleLineOps(x1: number, y1: number, x2: number, y2: number): Op[] {
    return this.doubleLine(x1, y1, x2, y2, true);
  }

  // Private helpers

  private cloneOptionsAlterSeed(ops: ResolvedOptions): ResolvedOptions {
    const result: ResolvedOptions = { ...ops };
    result.randomizer = undefined;
    if (ops.seed) {
      result.seed = ops.seed + 1;
    }
    return result;
  }

  private random(ops: ResolvedOptions): number {
    if (!ops.randomizer) {
      ops.randomizer = new Random(ops.seed || 0);
    }
    return ops.randomizer.next();
  }

  private offset(min: number, max: number, roughnessGain = 1): number {
    return this.options.roughness * roughnessGain * ((this.random(this.options) * (max - min)) + min);
  }

  private offsetOpt(x: number, roughnessGain = 1): number {
    return this.offset(-x, x, roughnessGain);
  }

  private doubleLine(x1: number, y1: number, x2: number, y2: number, filling = false): Op[] {
    const singleStroke = filling ? this.options.disableMultiStrokeFill : this.options.disableMultiStroke;
    const o1 = this.lineHelper(x1, y1, x2, y2, this.options, true, false);
    if (singleStroke) {
      return o1;
    }
    const o2 = this.lineHelper(x1, y1, x2, y2, this.options, true, true);
    return o1.concat(o2);
  }

  private lineHelper(x1: number, y1: number, x2: number, y2: number, o: ResolvedOptions, move: boolean, overlay: boolean): Op[] {
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

    let offset = o.maxRandomnessOffset || 0;
    if ((offset * offset * 100) > lengthSq) {
      offset = length / 10;
    }
    const halfOffset = offset / 2;
    const divergePoint = 0.2 + this.random(o) * 0.2;
    let midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
    let midDispY = o.bowing * o.maxRandomnessOffset * (x1 - x2) / 200;
    midDispX = this.offsetOpt(midDispX, roughnessGain);
    midDispY = this.offsetOpt(midDispY, roughnessGain);
    const ops: Op[] = [];
    const randomHalf = () => this.offsetOpt(halfOffset, roughnessGain);
    const randomFull = () => this.offsetOpt(offset, roughnessGain);
    const preserveVertices = o.preserveVertices;
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
            x1 + (preserveVertices ? 0 : this.offsetOpt(offset, roughnessGain)),
            y1 + (preserveVertices ? 0 : this.offsetOpt(offset, roughnessGain)),
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

  private curveWithOffset(points: Point[], offset: number, o: ResolvedOptions = this.options): Op[] {
    if (!points.length) {
      return [];
    }
    const ps: Point[] = [];
    ps.push([
      points[0][0] + this.offsetOpt(offset),
      points[0][1] + this.offsetOpt(offset),
    ]);
    ps.push([
      points[0][0] + this.offsetOpt(offset),
      points[0][1] + this.offsetOpt(offset),
    ]);
    for (let i = 1; i < points.length; i++) {
      ps.push([
        points[i][0] + this.offsetOpt(offset),
        points[i][1] + this.offsetOpt(offset),
      ]);
      if (i === (points.length - 1)) {
        ps.push([
          points[i][0] + this.offsetOpt(offset),
          points[i][1] + this.offsetOpt(offset),
        ]);
      }
    }
    return this.curveHelper(ps, null, o);
  }

  private curveHelper(points: Point[], closePoint: Point | null, o: ResolvedOptions): Op[] {
    const len = points.length;
    const ops: Op[] = [];
    if (len > 3) {
      const b = [];
      const s = 1 - o.curveTightness;
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
        const ro = o.maxRandomnessOffset;
        ops.push({ op: 'lineTo', data: [closePoint[0] + this.offsetOpt(ro), closePoint[1] + this.offsetOpt(ro)] });
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
      ops.push(...this.lineHelper(points[0][0], points[0][1], points[1][0], points[1][1], o, true, true));
    }
    return ops;
  }

  private computeEllipsePoints(increment: number, cx: number, cy: number, rx: number, ry: number, offset: number, overlap: number): Point[][] {
    const coreOnly = this.options.roughness === 0;
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
      const radOffset = this.offsetOpt(0.5) - (Math.PI / 2);
      allPoints.push([
        this.offsetOpt(offset) + cx + 0.9 * rx * Math.cos(radOffset - increment),
        this.offsetOpt(offset) + cy + 0.9 * ry * Math.sin(radOffset - increment),
      ]);
      const endAngle = Math.PI * 2 + radOffset - 0.01;
      for (let angle = radOffset; angle < endAngle; angle = angle + increment) {
        const p: Point = [
          this.offsetOpt(offset) + cx + rx * Math.cos(angle),
          this.offsetOpt(offset) + cy + ry * Math.sin(angle),
        ];
        corePoints.push(p);
        allPoints.push(p);
      }
      allPoints.push([
        this.offsetOpt(offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
        this.offsetOpt(offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5),
      ]);
      allPoints.push([
        this.offsetOpt(offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
        this.offsetOpt(offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap),
      ]);
      allPoints.push([
        this.offsetOpt(offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
        this.offsetOpt(offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5),
      ]);
    }


    return [allPoints, corePoints];
  }

  private arcHelper(increment: number, cx: number, cy: number, rx: number, ry: number, strt: number, stp: number, offset: number) {
    const radOffset = strt + this.offsetOpt(0.1);
    const points: Point[] = [];
    points.push([
      this.offsetOpt(offset) + cx + 0.9 * rx * Math.cos(radOffset - increment),
      this.offsetOpt(offset) + cy + 0.9 * ry * Math.sin(radOffset - increment),
    ]);
    for (let angle = radOffset; angle <= stp; angle = angle + increment) {
      points.push([
        this.offsetOpt(offset) + cx + rx * Math.cos(angle),
        this.offsetOpt(offset) + cy + ry * Math.sin(angle),
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
    return this.curveHelper(points, null, this.options);
  }

  private bezierTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number, current: Point): Op[] {
    const ops: Op[] = [];
    const ros = [this.options.maxRandomnessOffset || 1, (this.options.maxRandomnessOffset || 1) + 0.3];
    let f: Point = [0, 0];
    const iterations = this.options.disableMultiStroke ? 1 : 2;
    const preserveVertices = this.options.preserveVertices;
    for (let i = 0; i < iterations; i++) {
      if (i === 0) {
        ops.push({ op: 'move', data: [current[0], current[1]] });
      } else {
        ops.push({ op: 'move', data: [current[0] + (preserveVertices ? 0 : this.offsetOpt(ros[0])), current[1] + (preserveVertices ? 0 : this.offsetOpt(ros[0]))] });
      }
      f = preserveVertices ? [x, y] : [x + this.offsetOpt(ros[i]), y + this.offsetOpt(ros[i])];
      ops.push({
        op: 'bcurveTo',
        data: [
          x1 + this.offsetOpt(ros[i]), y1 + this.offsetOpt(ros[i]),
          x2 + this.offsetOpt(ros[i]), y2 + this.offsetOpt(ros[i]),
          f[0], f[1],
        ],
      });
    }
    return ops;
  }
}
