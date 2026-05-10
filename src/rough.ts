import { Config, SVGNode } from './core';
import { RoughGenerator } from './generator';
import { RoughSVG, StringRenderer, serializeSVG } from './svg';

/**
 * Main entry point for RoughJS.
 */
export default {
  /**
   * Create a RoughSVG instance that can generate SVGNodes.
   * @param config Optional configuration for the generator.
   */
  svgString(config?: Config): RoughSVG<SVGNode> {
    return new RoughSVG(new StringRenderer(), config);
  },

  /**
   * Create a RoughGenerator instance for generating Drawables.
   * @param config Optional configuration for the generator.
   */
  generator(config?: Config): RoughGenerator {
    return new RoughGenerator(config);
  },

  /**
   * Generate a new random seed.
   */
  newSeed(): number {
    return RoughGenerator.newSeed();
  },

  /**
   * Serialize an SVGNode to an SVG string.
   * @param node The SVGNode to serialize.
   */
  serialize(node: SVGNode): string {
    return serializeSVG(node);
  },
};
