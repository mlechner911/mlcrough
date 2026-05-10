/**
 * Represents a point in 2D space.
 */
import { Point } from './geometry';
import { Random } from './math';

export const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * Configuration object for MLCRough.
 */
export interface Config {
  /** Optional default options for all drawing operations. */
  options?: Options;
}

/**
 * Supported fill styles for shapes.
 */
export type FillStyle = 'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line' | 'multi-hachure' | 'gradient' | 'radial-gradient' | 'multi-dots';

/**
 * Supported geometric shapes.
 */
export type MLCRoughShape = 'line' | 'rectangle' | 'ellipse' | 'circle' | 'linearPath' | 'polygon' | 'arc' | 'curve' | 'path';

/**
 * Options to customize the appearance of a shape.
 */
export interface Options {
  /** Maximum distance from the actual line that the stroke can stray. */
  maxRandomnessOffset?: number;
  /** Numerical value indicating how rough the drawing is. 0 being smooth. */
  roughness?: number;
  /** Numerical value indicating how bowed the lines are. 0 being straight. */
  bowing?: number;
  /** Color of the stroke. */
  stroke?: string;
  /** Width of the stroke. */
  strokeWidth?: number;
  /** Numerical value for curve fitting. */
  curveFitting?: number;
  /** Numerical value for curve tightness. */
  curveTightness?: number;
  /** Number of steps to use when drawing a curve. */
  curveStepCount?: number;
  /** Color to fill the shape with. */
  fill?: string;
  /** Style of the fill. */
  fillStyle?: FillStyle;
  /** Weight of the fill stroke. */
  fillWeight?: number;
  /** Angle of the hachure lines. */
  hachureAngle?: number;
  /** Distance between hachure lines. */
  hachureGap?: number;
  /** Numerical value for path simplification. */
  simplification?: number;
  /** Offset for dashed strokes. */
  dashOffset?: number;
  /** Gap for dashed strokes. */
  dashGap?: number;
  /** Offset for zigzag strokes. */
  zigzagOffset?: number;
  /** Seed for the random number generator. */
  seed?: number;
  /** Array of numbers for stroke dash pattern. */
  strokeLineDash?: number[];
  /** Offset for the stroke dash pattern. */
  strokeLineDashOffset?: number;
  /** Array of numbers for fill dash pattern. */
  fillLineDash?: number[];
  /** Offset for the fill dash pattern. */
  fillLineDashOffset?: number;
  /** Disable multi-stroke for outline. */
  disableMultiStroke?: boolean;
  /** Disable multi-stroke for fill. */
  disableMultiStrokeFill?: boolean;
  /** Preserve vertices when drawing polygons/paths. */
  preserveVertices?: boolean;
  /** Number of decimal places to keep in SVG paths. */
  fixedDecimalPlaceDigits?: number;
  /** Gain for roughness when filling a shape. */
  fillShapeRoughnessGain?: number;
  /** Optional opacity for the stroke or fill. */
  opacity?: number;
  /** Optional range [min, max] for randomized opacity in multi-styled fills. */
  opacityRange?: [number, number];
}

/**
 * Options with all required fields resolved to their default values.
 */
export interface ResolvedOptions extends Options {
  maxRandomnessOffset: number;
  roughness: number;
  bowing: number;
  stroke: string;
  strokeWidth: number;
  curveFitting: number;
  curveTightness: number;
  curveStepCount: number;
  fillStyle: FillStyle;
  fillWeight: number;
  hachureAngle: number;
  hachureGap: number;
  dashOffset: number;
  dashGap: number;
  zigzagOffset: number;
  seed: number;
  randomizer?: Random;
  disableMultiStroke: boolean;
  disableMultiStrokeFill: boolean;
  preserveVertices: boolean;
  fillShapeRoughnessGain: number;
  opacity?: number;
  opacityRange?: [number, number];
}

/** Supported operation types in a path. */
export declare type OpType = 'move' | 'bcurveTo' | 'lineTo' | 'close';
/** Supported operation set types. */
export declare type OpSetType = 'path' | 'fillPath' | 'fillSketch';

/**
 * A single drawing operation.
 */
export interface Op {
  /** Type of the operation. */
  op: OpType;
  /** Data for the operation (coordinates). */
  data: number[];
}

/**
 * A set of drawing operations.
 */
export interface OpSet {
  /** Type of the operation set. */
  type: OpSetType;
  /** Array of operations. */
  ops: Op[];
  /** Optional size of the set. */
  size?: Point;
  /** Optional SVG path string. */
  path?: string;
  /** Optional local style overrides for this set. */
  options?: Options;
}

/**
 * Represents a drawable object that contains the shape type, options and drawing operations.
 */
export interface Drawable {
  /** Type of the shape. */
  shape: MLCRoughShape;
  /** Resolved options used for drawing. */
  options: ResolvedOptions;
  /** Array of operation sets. */
  sets: OpSet[];
}

/**
 * Information about an SVG path.
 */
export interface PathInfo {
  /** SVG path data (d attribute). */
  d: string;
  /** Stroke color. */
  stroke: string;
  /** Stroke width. */
  strokeWidth: number;
  /** Optional fill color. */
  fill?: string;
}

/**
 * Represents an abstract SVG node.
 */
export interface SVGNode {
  /** Tag name of the node. */
  tag: string;
  /** Attributes of the node. */
  attributes: { [key: string]: string };
  /** Children nodes. */
  children: SVGNode[];
}

/**
 * Interface for an SVG renderer.
 */
export interface SVGRenderer<T> {
  /** Create an element with a tag and attributes. */
  createElement(tag: string, attrs: { [key: string]: string }): T;
  /** Create a group element. */
  createGroup(): T;
  /** Append a child to a parent element. */
  appendChild(parent: T, child: T): void;
}
