import { Config, SVGNode } from './core';
import { MLCRoughGenerator } from './generator';
import { MLCRoughSVG, StringRenderer, serializeSVG } from './svg';
import { RoughenOptions, roughen } from './roughen';

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

  /**
   * Redraws every shape of an existing SVG document in a hand-drawn style.
   * Text, markers, gradients and the surrounding markup are left untouched.
   * @param svg The source SVG document.
   * @param options Drawing options, plus `onShape` and `includeDefs`.
   */
  roughen(svg: string, options?: RoughenOptions): string {
    return roughen(svg, options);
  },
};

export type { RoughenOptions, ShapeInfo } from './roughen';
export { roughen } from './roughen';
