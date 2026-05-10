import { Config, Options, Drawable, OpSet, Op, ResolvedOptions, PathInfo, MLCRoughShape } from './core.js';
import { Point } from './geometry.js';
import { MLCRoughRenderer } from './renderer.js';
import { randomSeed } from './math.js';
import * as poc_module from 'points-on-curve';
import * as poc_bezier_module from 'points-on-curve/lib/curve-to-bezier.js';
import * as pop_module from 'points-on-path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poc: any = poc_module;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poc_bezier: any = poc_bezier_module;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pop: any = pop_module;

const curveToBezier = poc_bezier.curveToBezier || poc_bezier.default?.curveToBezier || poc_bezier.default;
const pointsOnBezierCurves = poc.pointsOnBezierCurves || poc.default?.pointsOnBezierCurves;
const pointsOnPath = pop.pointsOnPath || pop.default?.pointsOnPath;

const NOS = 'none';

/**
 * The MLCRoughGenerator class provides methods to generate Drawable objects for various shapes.
 * These Drawables can then be rendered using a MLCRoughRenderer.
 */
export class MLCRoughGenerator {
  private config: Config;

  /** Default options for the generator. */
  defaultOptions: ResolvedOptions = {
    maxRandomnessOffset: 2,
    roughness: 1,
    bowing: 1,
    stroke: '#000',
    strokeWidth: 1,
    curveTightness: 0,
    curveFitting: 0.95,
    curveStepCount: 9,
    fillStyle: 'hachure',
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1,
    dashOffset: -1,
    dashGap: -1,
    zigzagOffset: -1,
    seed: 0,
    disableMultiStroke: false,
    disableMultiStrokeFill: false,
    preserveVertices: false,
    fillShapeRoughnessGain: 0.8,
    fixedDecimalPlaceDigits: 3
  };

  constructor(config?: Config) {
    this.config = config || {};
    if (this.config.options) {
      this.defaultOptions = this._o(this.config.options);
    }
  }

  /**
   * Generates a new random seed.
   */
  static newSeed(): number {
    return randomSeed();
  }

  private _o(options?: Options): ResolvedOptions {
    return options ? Object.assign({}, this.defaultOptions, options) : this.defaultOptions;
  }

  private _d(shape: MLCRoughShape, sets: OpSet[], options: ResolvedOptions): Drawable {
    return { shape, sets: sets || [], options: options || this.defaultOptions };
  }

  /**
   * Draws a line between two points.
   * @param x1 x-coordinate of the first point.
   * @param y1 y-coordinate of the first point.
   * @param x2 x-coordinate of the second point.
   * @param y2 y-coordinate of the second point.
   * @param options Optional options to customize the line.
   */
  line(x1: number, y1: number, x2: number, y2: number, options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    return this._d('line', [renderer.line(x1, y1, x2, y2)], o);
  }

  /**
   * Draws a rectangle.
   * @param x x-coordinate of the top-left corner.
   * @param y y-coordinate of the top-left corner.
   * @param width Width of the rectangle.
   * @param height Height of the rectangle.
   * @param options Optional options to customize the rectangle.
   */
  rectangle(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths = [];
    const outline = renderer.rectangle(x, y, width, height);
    if (o.fill) {
      const points: Point[] = [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
      if (o.fillStyle === 'solid') {
        paths.push(renderer.solidFillPolygon([points]));
      } else {
        paths.push(renderer.patternFillPolygons([points]));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('rectangle', paths, o);
  }

  /**
   * Draws an ellipse.
   * @param x x-coordinate of the center.
   * @param y y-coordinate of the center.
   * @param width Width of the ellipse.
   * @param height Height of the ellipse.
   * @param options Optional options to customize the ellipse.
   */
  ellipse(x: number, y: number, width: number, height: number, options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths: OpSet[] = [];
    const ellipseParams = renderer.generateEllipseParams(width, height);
    const ellipseResponse = renderer.ellipseWithParams(x, y, ellipseParams);
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        const shape = renderer.ellipseWithParams(x, y, ellipseParams).opset;
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(renderer.patternFillPolygons([ellipseResponse.estimatedPoints]));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(ellipseResponse.opset);
    }
    return this._d('ellipse', paths, o);
  }

  /**
   * Draws a circle.
   * @param x x-coordinate of the center.
   * @param y y-coordinate of the center.
   * @param diameter Diameter of the circle.
   * @param options Optional options to customize the circle.
   */
  circle(x: number, y: number, diameter: number, options?: Options): Drawable {
    const ret = this.ellipse(x, y, diameter, diameter, options);
    ret.shape = 'circle';
    return ret;
  }

  /**
   * Draws a linear path defined by a series of points.
   * @param points Array of points defining the path.
   * @param options Optional options to customize the path.
   */
  linearPath(points: Point[], options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    return this._d('linearPath', [renderer.linearPath(points, false)], o);
  }

  /**
   * Draws an arc.
   * @param x x-coordinate of the center.
   * @param y y-coordinate of the center.
   * @param width Width of the ellipse the arc is part of.
   * @param height Height of the ellipse the arc is part of.
   * @param start Start angle of the arc in radians.
   * @param stop Stop angle of the arc in radians.
   * @param closed Whether the arc should be closed.
   * @param options Optional options to customize the arc.
   */
  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths = [];
    const outline = renderer.arc(x, y, width, height, start, stop, closed, true);
    if (closed && o.fill) {
      if (o.fillStyle === 'solid') {
        const fillOptions: ResolvedOptions = { ...o };
        fillOptions.disableMultiStroke = true;
        const fillRenderer = new MLCRoughRenderer(fillOptions);
        const shape = fillRenderer.arc(x, y, width, height, start, stop, true, false);
        shape.type = 'fillPath';
        paths.push(shape);
      } else {
        paths.push(renderer.patternFillArc(x, y, width, height, start, stop));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('arc', paths, o);
  }

  /**
   * Draws a curve through a series of points.
   * @param points Array of points defining the curve.
   * @param options Optional options to customize the curve.
   */
  curve(points: Point[] | Point[][], options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths: OpSet[] = [];
    const outline = renderer.curve(points);
    if (o.fill && o.fill !== NOS) {
      if (o.fillStyle === 'solid') {
        const fillRenderer = new MLCRoughRenderer({ ...o, disableMultiStroke: true, roughness: o.roughness ? (o.roughness + o.fillShapeRoughnessGain) : 0 });
        const fillShape = fillRenderer.curve(points);
        paths.push({
          type: 'fillPath',
          ops: this._mergedShape(fillShape.ops),
        });
      } else {
        const polyPoints: Point[] = [];
        const inputPoints = points;
        if (inputPoints.length) {
          const p1 = inputPoints[0];
          const pointsList = (typeof p1[0] === 'number') ? [inputPoints as Point[]] : inputPoints as Point[][];
          for (const points of pointsList) {
            if (points.length < 3) {
              polyPoints.push(...points);
            } else if (points.length === 3) {
              polyPoints.push(...pointsOnBezierCurves(curveToBezier([
                points[0],
                points[0],
                points[1],
                points[2],
              ]), 10, (1 + o.roughness) / 2));
            } else {
              polyPoints.push(...pointsOnBezierCurves(curveToBezier(points), 10, (1 + o.roughness) / 2));
            }
          }
        }
        if (polyPoints.length) {
          paths.push(renderer.patternFillPolygons([polyPoints]));
        }
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('curve', paths, o);
  }

  /**
   * Draws a polygon defined by a series of points.
   * @param points Array of points defining the polygon.
   * @param options Optional options to customize the polygon.
   */
  polygon(points: Point[], options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths: OpSet[] = [];
    const outline = renderer.linearPath(points, true);
    if (o.fill) {
      if (o.fillStyle === 'solid') {
        paths.push(renderer.solidFillPolygon([points]));
      } else {
        paths.push(renderer.patternFillPolygons([points]));
      }
    }
    if (o.stroke !== NOS) {
      paths.push(outline);
    }
    return this._d('polygon', paths, o);
  }

  /**
   * Draws an SVG path.
   * @param d SVG path data string.
   * @param options Optional options to customize the path.
   */
  path(d: string, options?: Options): Drawable {
    const o = this._o(options);
    const renderer = new MLCRoughRenderer(o);
    const paths: OpSet[] = [];
    if (!d) {
      return this._d('path', paths, o);
    }
    d = (d || '').replace(/\n/g, ' ').replace(/(-\s)/g, '-').replace('/(\s\s)/g', ' ');

    const hasFill = o.fill && o.fill !== 'transparent' && o.fill !== NOS;
    const hasStroke = o.stroke !== NOS;
    const simplified = !!(o.simplification && (o.simplification < 1));
    const distance = simplified ? (4 - 4 * (o.simplification || 1)) : ((1 + o.roughness) / 2);
    const sets = pointsOnPath(d, 1, distance);
    const shape = renderer.svgPath(d);

    if (hasFill) {
      if (o.fillStyle === 'solid') {
        if (sets.length === 1) {
          const fillRenderer = new MLCRoughRenderer({ ...o, disableMultiStroke: true, roughness: o.roughness ? (o.roughness + o.fillShapeRoughnessGain) : 0 });
          const fillShape = fillRenderer.svgPath(d);
          paths.push({
            type: 'fillPath',
            ops: this._mergedShape(fillShape.ops),
          });
        } else {
          paths.push(renderer.solidFillPolygon(sets));
        }
      } else {
        paths.push(renderer.patternFillPolygons(sets));
      }
    }
    if (hasStroke) {
      if (simplified) {
        sets.forEach((set: Point[]) => {
          paths.push(renderer.linearPath(set, false));
        });
      } else {
        paths.push(shape);
      }
    }

    return this._d('path', paths, o);
  }

  /**
   * Converts drawing operations to an SVG path string.
   * @param drawing The OpSet containing the operations.
   * @param fixedDecimals Optional number of decimal places to keep.
   */
  opsToPath(drawing: OpSet, fixedDecimals?: number): string {
    let path = '';
    for (const item of drawing.ops) {
      const data = ((typeof fixedDecimals === 'number') && fixedDecimals >= 0) ? (item.data.map((d) => +d.toFixed(fixedDecimals))) : item.data;
      switch (item.op) {
        case 'move':
          path += `M${data[0]} ${data[1]} `;
          break;
        case 'bcurveTo':
          path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
          break;
        case 'lineTo':
          path += `L${data[0]} ${data[1]} `;
          break;
      }
    }
    return path.trim();
  }

  /**
   * Converts a Drawable to an array of PathInfo objects.
   * @param drawable The Drawable object to convert.
   */
  toPaths(drawable: Drawable): PathInfo[] {
    const sets = drawable.sets || [];
    const o = drawable.options || this.defaultOptions;
    const paths: PathInfo[] = [];
    for (const drawing of sets) {
      let path: PathInfo | null = null;
      switch (drawing.type) {
        case 'path':
          path = {
            d: this.opsToPath(drawing),
            stroke: o.stroke,
            strokeWidth: o.strokeWidth,
            fill: NOS,
          };
          break;
        case 'fillPath':
          path = {
            d: this.opsToPath(drawing),
            stroke: NOS,
            strokeWidth: 0,
            fill: o.fill || NOS,
          };
          break;
        case 'fillSketch':
          path = this.fillSketch(drawing, o);
          break;
      }
      if (path) {
        paths.push(path);
      }
    }
    return paths;
  }

  private fillSketch(drawing: OpSet, o: ResolvedOptions): PathInfo {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    return {
      d: this.opsToPath(drawing),
      stroke: o.fill || NOS,
      strokeWidth: fweight,
      fill: NOS,
    };
  }

  private _mergedShape(input: Op[]): Op[] {
    return input.filter((d, i) => {
      if (i === 0) {
        return true;
      }
      if (d.op === 'move') {
        return false;
      }
      return true;
    });
  }
}
