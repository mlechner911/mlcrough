import { ResolvedOptions } from './core.js';
import { Random } from './math.js';

/**
 * Context for geometric operations, providing access to options and random numbers.
 */
export interface GeometricContext {
  options: ResolvedOptions;
  random(): number;
}

/**
 * Creates a geometric context from resolved options.
 */
export function createGeometricContext(options: ResolvedOptions): GeometricContext {
  if (!options.randomizer) {
    options.randomizer = new Random(options.seed || 0);
  }
  const randomizer = options.randomizer;
  return {
    options,
    random: () => randomizer.next(),
  };
}

/**
 * Helper to calculate an offset based on roughness.
 */
export function offset(min: number, max: number, context: GeometricContext, roughnessGain = 1): number {
  return context.options.roughness * roughnessGain * ((context.random() * (max - min)) + min);
}

/**
 * Helper to calculate a symmetric offset based on roughness.
 */
export function offsetOpt(x: number, context: GeometricContext, roughnessGain = 1): number {
  return offset(-x, x, context, roughnessGain);
}
