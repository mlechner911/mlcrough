import { Config, Options, OpSet, ResolvedOptions, Drawable, SVGRenderer, SVGNode } from './core';
import { MLCRoughGenerator } from './generator';
import { Point } from './geometry';

/**
 * High-level class for rendering Drawables to SVG nodes or strings.
 */
export class MLCRoughSVG<T> {
  private gen: MLCRoughGenerator;
  private renderer: SVGRenderer<T>;

  constructor(renderer: SVGRenderer<T>, config?: Config) {
    this.renderer = renderer;
    this.gen = new MLCRoughGenerator(config);
  }

  /**
   * Renders a Drawable object using the current renderer.
   * @param drawable The Drawable object to render.
   */
  draw(drawable: Drawable): T {
    const sets = drawable.sets || [];
    const o = drawable.options || this.getDefaultOptions();
    const g = this.renderer.createGroup();
    const precision = drawable.options.fixedDecimalPlaceDigits;
    for (const drawing of sets) {
      const opOptions = drawing.options ? Object.assign({}, o, drawing.options) : o;
      let path = null;
      switch (drawing.type) {
        case 'path': {
          const attrs: { [key: string]: string } = {
            d: this.opsToPath(drawing, precision),
            stroke: opOptions.stroke,
            'stroke-width': opOptions.strokeWidth + '',
            fill: 'none',
          };
          if (opOptions.strokeLineDash) {
            attrs['stroke-dasharray'] = opOptions.strokeLineDash.join(' ').trim();
          }
          if (opOptions.strokeLineDashOffset) {
            attrs['stroke-dashoffset'] = String(opOptions.strokeLineDashOffset);
          }
          if (opOptions.opacity !== undefined) {
            attrs['stroke-opacity'] = String(opOptions.opacity);
          }
          path = this.renderer.createElement('path', attrs);
          break;
        }
        case 'fillPath': {
          const attrs: { [key: string]: string } = {
            d: this.opsToPath(drawing, precision),
            stroke: 'none',
            'stroke-width': '0',
            fill: opOptions.fill || '',
          };
          if (drawable.shape === 'curve' || drawable.shape === 'polygon') {
            attrs['fill-rule'] = 'evenodd';
          }
          if (opOptions.opacity !== undefined) {
            attrs['fill-opacity'] = String(opOptions.opacity);
          }
          path = this.renderer.createElement('path', attrs);
          break;
        }
        case 'fillSketch': {
          path = this.fillSketch(drawing, opOptions);
          break;
        }
      }
      if (path) {
        this.renderer.appendChild(g, path);
      }
    }
    return g;
  }

  private fillSketch(drawing: OpSet, o: ResolvedOptions): T {
    let fweight = o.fillWeight;
    if (fweight < 0) {
      fweight = o.strokeWidth / 2;
    }
    const attrs: { [key: string]: string } = {
      d: this.opsToPath(drawing, o.fixedDecimalPlaceDigits),
      stroke: o.fill || '',
      'stroke-width': fweight + '',
      fill: 'none',
    };
    if (o.fillLineDash) {
      attrs['stroke-dasharray'] = o.fillLineDash.join(' ').trim();
    }
    if (o.fillLineDashOffset) {
      attrs['stroke-dashoffset'] = String(o.fillLineDashOffset);
    }
    if (o.opacity !== undefined) {
      attrs['stroke-opacity'] = String(o.opacity);
    }
    return this.renderer.createElement('path', attrs);
  }

  /**
   * Returns the underlying MLCRoughGenerator instance.
   */
  get generator(): MLCRoughGenerator {
    return this.gen;
  }

  /**
   * Returns default options used by the generator.
   */
  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  /**
   * Converts drawing operations to an SVG path string.
   */
  opsToPath(drawing: OpSet, fixedDecimalPlaceDigits?: number): string {
    return this.gen.opsToPath(drawing, fixedDecimalPlaceDigits);
  }

  /** Draws a line. */
  line(x1: number, y1: number, x2: number, y2: number, options?: Options): T {
    const d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  /** Draws a rectangle. */
  rectangle(x: number, y: number, width: number, height: number, options?: Options): T {
    const d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  /** Draws an ellipse. */
  ellipse(x: number, y: number, width: number, height: number, options?: Options): T {
    const d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  /** Draws a circle. */
  circle(x: number, y: number, diameter: number, options?: Options): T {
    const d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  /** Draws a linear path. */
  linearPath(points: Point[], options?: Options): T {
    const d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  /** Draws a polygon. */
  polygon(points: Point[], options?: Options): T {
    const d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  /** Draws an arc. */
  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): T {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  /** Draws a curve. */
  curve(points: Point[] | Point[][], options?: Options): T {
    const d = this.gen.curve(points, options);
    return this.draw(d);
  }

  /** Draws an SVG path. */
  path(d: string, options?: Options): T {
    const drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }
}

/**
 * Implementation of SVGRenderer that generates SVGNode objects.
 */
export class StringRenderer implements SVGRenderer<SVGNode> {
  createElement(tag: string, attributes: { [key: string]: string }): SVGNode {
    return { tag, attributes, children: [] };
  }
  createGroup(): SVGNode {
    return this.createElement('g', {});
  }
  appendChild(parent: SVGNode, child: SVGNode): void {
    parent.children.push(child);
  }
}

/**
 * Serializes an SVGNode to an SVG string.
 */
export function serializeSVG(node: SVGNode): string {
  const attrs = Object.keys(node.attributes).map((k) => `${k}="${node.attributes[k]}"`).join(' ');
  const children = node.children.map(serializeSVG).join('');
  return `<${node.tag} ${attrs}>${children}</${node.tag}>`;
}
