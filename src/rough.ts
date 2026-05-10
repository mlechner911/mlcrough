import { Config, SVGNode } from './core';
import { RoughGenerator } from './generator';
import { RoughSVG, StringRenderer, serializeSVG } from './svg';

export default {
  svgString(config?: Config): RoughSVG<SVGNode> {
    return new RoughSVG(new StringRenderer(), config);
  },

  generator(config?: Config): RoughGenerator {
    return new RoughGenerator(config);
  },

  newSeed(): number {
    return RoughGenerator.newSeed();
  },

  serialize(node: SVGNode): string {
    return serializeSVG(node);
  },
};
