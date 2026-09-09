/**
 * Mermaid draws the diagram, mlcrough draws it by hand.
 *
 * The diagram happens to be this function's own pipeline, which is the
 * shortest honest demonstration available: the picture explaining how
 * roughen() works is drawn by roughen().
 *
 * The input under `examples/svg-in/` is the unedited output of
 * `mmdc -i flow.mmd -o flow.svg` (the Mermaid CLI). Nothing about it was
 * prepared for mlcrough — that is the whole point: any tool that emits SVG
 * can be put in front of `roughen()`.
 *
 * The interesting part is what Mermaid leaves out of the elements. Its nodes
 * look like this:
 *
 *   <rect class="basic label-container" x="-130" y="-39" width="260" height="78"/>
 *
 * There is no fill and no stroke on the element at all; both live in the
 * stylesheet Mermaid embeds in the document:
 *
 *   #my-svg .node rect, … { fill:#ECECFF; stroke:#9370DB; stroke-width:1px; }
 *
 * So `roughen()` resolves the cascade before it redraws anything — otherwise
 * every box would come out in the SVG default of solid black. Labels,
 * arrowheads and the stylesheet itself are passed through untouched.
 *
 *   npm run example:roughen-mermaid > test-output/roughen-mermaid.svg
 *
 * To regenerate the input:
 *   npx @mermaid-js/mermaid-cli -i examples/svg-in/mermaid-pipeline.mmd \
 *                               -o examples/svg-in/mermaid-pipeline.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mlcrough from '../src/mlcrough.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, 'svg-in/mermaid-pipeline.svg'), 'utf8');

const sketch = mlcrough.roughen(source, {
  roughness: 1.4,
  bowing: 1.5,
  fillStyle: 'hachure',
  hachureGap: 9,
  seed: 42, // a fixed seed keeps the output byte-identical between runs
  // The labels sit straight on the hachure, so give them something to sit on.
  // For a <foreignObject> — which is what Mermaid puts its labels in — the box
  // is known exactly; for a <text> it is estimated from the font size.
  textBackground: true,
});

process.stdout.write(sketch);
