import { Config, SVGNode } from './core';
import { MLCRoughGenerator } from './generator';
import { MLCRoughSVG, StringRenderer, serializeSVG } from './svg';

/**
 * Main entry point for MLCRough.
 */
export default {
  /**
   * Create a MLCRoughSVG instance that can generate SVGNodes.
   * @param config Optional configuration for the generator.
   */
  svgString(config?: Config): MLCRoughSVG<SVGNode> {
    return new MLCRoughSVG(new StringRenderer(), config);
  },

  /**
   * Create a MLCRoughGenerator instance for generating Drawables.
   * @param config Optional configuration for the generator.
   */
  generator(config?: Config): MLCRoughGenerator {
    return new MLCRoughGenerator(config);
  },

  /**
   * Generate a new random seed.
   */
  newSeed(): number {
    return MLCRoughGenerator.newSeed();
  },

  /**
   * Serialize an SVGNode to an SVG string.
   * @param node The SVGNode to serialize.
   */
  serialize(node: SVGNode): string {
    return serializeSVG(node);
  },
};
