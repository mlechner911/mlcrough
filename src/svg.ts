import { Config, Options, OpSet, ResolvedOptions, Drawable, SVGNS, SVGRenderer, SVGNode } from './core';
import { RoughGenerator } from './generator';
import { Point } from './geometry';

export class RoughSVG<T> {
  private gen: RoughGenerator;
  private renderer: SVGRenderer<T>;

  constructor(renderer: SVGRenderer<T>, config?: Config) {
    this.renderer = renderer;
    this.gen = new RoughGenerator(config);
  }

  draw(drawable: Drawable): T {
    const sets = drawable.sets || [];
    const o = drawable.options || this.getDefaultOptions();
    const g = this.renderer.createGroup();
    const precision = drawable.options.fixedDecimalPlaceDigits;
    for (const drawing of sets) {
      let path = null;
      switch (drawing.type) {
        case 'path': {
          const attrs: { [key: string]: string } = {
            d: this.opsToPath(drawing, precision),
            stroke: o.stroke,
            'stroke-width': o.strokeWidth + '',
            fill: 'none',
          };
          if (o.strokeLineDash) {
            attrs['stroke-dasharray'] = o.strokeLineDash.join(' ').trim();
          }
          if (o.strokeLineDashOffset) {
            attrs['stroke-dashoffset'] = String(o.strokeLineDashOffset);
          }
          path = this.renderer.createElement('path', attrs);
          break;
        }
        case 'fillPath': {
          const attrs: { [key: string]: string } = {
            d: this.opsToPath(drawing, precision),
            stroke: 'none',
            'stroke-width': '0',
            fill: o.fill || '',
          };
          if (drawable.shape === 'curve' || drawable.shape === 'polygon') {
            attrs['fill-rule'] = 'evenodd';
          }
          path = this.renderer.createElement('path', attrs);
          break;
        }
        case 'fillSketch': {
          path = this.fillSketch(drawing, o);
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
    return this.renderer.createElement('path', attrs);
  }

  get generator(): RoughGenerator {
    return this.gen;
  }

  getDefaultOptions(): ResolvedOptions {
    return this.gen.defaultOptions;
  }

  opsToPath(drawing: OpSet, fixedDecimalPlaceDigits?: number): string {
    return this.gen.opsToPath(drawing, fixedDecimalPlaceDigits);
  }

  line(x1: number, y1: number, x2: number, y2: number, options?: Options): T {
    const d = this.gen.line(x1, y1, x2, y2, options);
    return this.draw(d);
  }

  rectangle(x: number, y: number, width: number, height: number, options?: Options): T {
    const d = this.gen.rectangle(x, y, width, height, options);
    return this.draw(d);
  }

  ellipse(x: number, y: number, width: number, height: number, options?: Options): T {
    const d = this.gen.ellipse(x, y, width, height, options);
    return this.draw(d);
  }

  circle(x: number, y: number, diameter: number, options?: Options): T {
    const d = this.gen.circle(x, y, diameter, options);
    return this.draw(d);
  }

  linearPath(points: Point[], options?: Options): T {
    const d = this.gen.linearPath(points, options);
    return this.draw(d);
  }

  polygon(points: Point[], options?: Options): T {
    const d = this.gen.polygon(points, options);
    return this.draw(d);
  }

  arc(x: number, y: number, width: number, height: number, start: number, stop: number, closed: boolean = false, options?: Options): T {
    const d = this.gen.arc(x, y, width, height, start, stop, closed, options);
    return this.draw(d);
  }

  curve(points: Point[] | Point[][], options?: Options): T {
    const d = this.gen.curve(points, options);
    return this.draw(d);
  }

  path(d: string, options?: Options): T {
    const drawing = this.gen.path(d, options);
    return this.draw(drawing);
  }
}

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

export function serializeSVG(node: SVGNode): string {
  const attrs = Object.keys(node.attributes).map((k) => `${k}="${node.attributes[k]}"`).join(' ');
  const children = node.children.map(serializeSVG).join('');
  return `<${node.tag} ${attrs}>${children}</${node.tag}>`;
}
