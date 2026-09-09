/**
 * What roughen() promises: shapes are redrawn, everything else comes back
 * untouched, and the same input with the same seed gives the same bytes.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { roughen } from '../src/roughen.js';

const FIXTURE = path.join(import.meta.dirname, '../examples/svg-in/mermaid-pipeline.svg');
const wrap = (body: string, extra: string = 'viewBox="0 0 100 100"'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${extra}>${body}</svg>`;

/** Counts occurrences of a pattern, since a document is often one long line. */
const count = (haystack: string, needle: RegExp): number => (haystack.match(needle) || []).length;

describe('which elements are redrawn', () => {
  it.each([
    ['rect', '<rect x="1" y="1" width="20" height="10" stroke="#000"/>'],
    ['circle', '<circle cx="10" cy="10" r="5" stroke="#000"/>'],
    ['ellipse', '<ellipse cx="10" cy="10" rx="8" ry="4" stroke="#000"/>'],
    ['line', '<line x1="0" y1="0" x2="20" y2="20" stroke="#000"/>'],
    ['polyline', '<polyline points="0,0 10,10 20,0" stroke="#000"/>'],
    ['polygon', '<polygon points="0,0 10,10 20,0" stroke="#000"/>'],
    ['path', '<path d="M0 0 L20 20" stroke="#000"/>'],
  ])('redraws %s', (tag, markup) => {
    const out = roughen(wrap(markup));
    // The replacement is itself a group of <path>s, so for the path case the
    // test is that the original geometry is gone, not that the tag is.
    expect(out).not.toContain(markup);
    expect(count(out, /<g[ >]/g)).toBe(1);
    expect(count(out, /<path /g)).toBeGreaterThan(0);
    expect(tag).toBeTruthy();
  });

  it('leaves text alone', () => {
    const out = roughen(wrap('<text x="1" y="2" font-size="10">hello</text>'));
    expect(out).toContain('<text x="1" y="2" font-size="10">hello</text>');
  });

  it('leaves referenced material alone', () => {
    // A sketched arrowhead would be redrawn at every marker position, and a
    // roughened clip path stops clipping cleanly.
    const defs = '<defs><marker id="m"><path d="M0 0 L5 5"/></marker><clipPath id="c"><rect width="9" height="9"/></clipPath></defs>';
    expect(roughen(wrap(defs + '<rect width="20" height="10" stroke="#000"/>'))).toContain(defs);
  });

  it('redraws inside defs when asked to', () => {
    const out = roughen(wrap('<defs><rect id="r" width="20" height="10" stroke="#000"/></defs>'), { includeDefs: true });
    expect(out).not.toContain('<rect id="r"');
  });

  it('skips a shape whose size is a percentage', () => {
    // There is no viewport to resolve it against here, so leaving it is the
    // only honest answer.
    expect(roughen(wrap('<rect width="50%" height="10" fill="#f00"/>'))).toContain('<rect width="50%" height="10" fill="#f00"/>');
  });

  it('skips a hidden or zero-sized shape', () => {
    expect(roughen(wrap('<rect width="0" height="10" fill="#f00"/>'))).toContain('<rect width="0"');
    expect(roughen(wrap('<rect width="9" height="9" fill="#f00" display="none"/>'))).toContain('display="none"');
  });
});

describe('paint', () => {
  it('takes colours from the stylesheet when the element carries none', () => {
    const out = roughen(wrap('<style>#s .node rect{fill:#ECECFF;stroke:#9370DB}</style><g class="node"><rect width="20" height="10"/></g>', 'id="s" viewBox="0 0 100 100"'));
    expect(out).toContain('#ECECFF');
    expect(out).toContain('#9370DB');
  });

  it('draws a filled shape that has no stroke of its own', () => {
    // Regression: hachure takes its line weight from strokeWidth / 2, so
    // zeroing the width for an unstroked shape drew the fill in lines of
    // width 0 — invisible. Chart libraries emit exactly this for fill areas.
    const out = roughen(wrap('<path d="M0 0 L20 0 L20 20 Z" fill="#f00" stroke="none"/>'));
    const widths = [...out.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(widths.length).toBeGreaterThan(0);
    expect(widths.every((w) => w > 0)).toBe(true);
  });

  it('paints a gradient reference as one solid area', () => {
    const out = roughen(wrap('<rect width="20" height="10" fill="url(#g)"/>'));
    expect(out).toContain('fill="url(#g)"');
  });

  it('carries an element transform onto the replacement', () => {
    expect(roughen(wrap('<rect width="20" height="10" fill="#f00" transform="rotate(15)"/>')))
      .toContain('transform="rotate(15)"');
  });
});

describe('the viewport', () => {
  it('grows the viewBox so wandering strokes are not clipped', () => {
    const out = roughen(wrap('<rect width="20" height="10" stroke="#000"/>'), { padding: 4 });
    expect(out).toContain('viewBox="-4 -4 108 108"');
  });

  it('leaves the viewBox alone when padding is 0', () => {
    expect(roughen(wrap('<rect width="20" height="10" stroke="#000"/>'), { padding: 0 }))
      .toContain('viewBox="0 0 100 100"');
  });
});

describe('determinism', () => {
  it('gives byte-identical output for the same seed', () => {
    // Regression: fillers were cached at module level, so each one kept the
    // render helper — and therefore the randomizer — of whichever call built
    // it first. Outlines stayed reproducible, fills drifted with every further
    // call in the same process, and `seed` did not govern them at all.
    const fixture = fs.readFileSync(FIXTURE, 'utf8');
    expect(roughen(fixture, { seed: 42 })).toBe(roughen(fixture, { seed: 42 }));
  });

  it('gives the same fill for the same seed no matter what was drawn before', () => {
    const svg = wrap('<rect width="20" height="10" fill="#f00"/>');
    const first = roughen(svg, { seed: 5 });
    roughen(wrap('<circle cx="9" cy="9" r="8" fill="#00f"/>'), { seed: 99 });
    expect(roughen(svg, { seed: 5 })).toBe(first);
  });

  it('gives different output for a different seed', () => {
    const svg = wrap('<rect width="20" height="10" stroke="#000"/>');
    expect(roughen(svg, { seed: 1 })).not.toBe(roughen(svg, { seed: 2 }));
  });
});

describe('onShape', () => {
  it('sees every shape once, with its computed style', () => {
    const seen: string[] = [];
    roughen(wrap('<style>rect{fill:#abc}</style><rect width="9" height="9"/><circle cx="5" cy="5" r="2" stroke="#000"/>'), {
      onShape: ({ tag, style }) => { seen.push(`${tag}:${style['fill'] ?? '-'}`); },
    });
    expect(seen).toEqual(['rect:#abc', 'circle:-']);
  });

  it('passes an element through when it returns false', () => {
    const out = roughen(wrap('<rect width="20" height="10" stroke="#000"/>'), {
      onShape: ({ tag }) => (tag === 'rect' ? false : undefined),
    });
    expect(out).toContain('<rect width="20" height="10" stroke="#000"/>');
  });

  it('merges the options it returns for that shape only', () => {
    const svg = wrap('<line x1="0" y1="0" x2="50" y2="0" stroke="#000"/><path d="M0 10 L50 10" stroke="#000"/>');
    const straight = roughen(svg, { bowing: 3, onShape: ({ tag }) => (tag === 'line' ? { bowing: 0 } : undefined) });
    const bowed = roughen(svg, { bowing: 3 });
    expect(straight).not.toBe(bowed);
  });
});

describe('textBackground', () => {
  it('uses the exact box of a foreignObject', () => {
    const out = roughen(wrap('<foreignObject x="5" y="6" width="40" height="20"><div/></foreignObject>'), {
      textBackground: { fill: '#fff', padding: 2 },
    });
    expect(out).toContain('<rect x="3" y="4" width="44" height="24" fill="#fff"/>');
  });

  it('estimates the box of a text element from its font size and length', () => {
    const out = roughen(wrap('<text x="50" y="20" font-size="10" text-anchor="middle">abcd</text>'), {
      textBackground: true,
    });
    // 4 characters at 0.55 em => 22 wide, centred on x=50, plus 2 padding.
    expect(out).toContain('<rect x="37" y="10" width="26" height="15.5" fill="#fff"/>');
  });

  it('adds nothing when it is off', () => {
    expect(roughen(wrap('<text x="1" y="2">hi</text>'))).not.toContain('<rect');
  });

  it('accepts a colour as shorthand', () => {
    expect(roughen(wrap('<foreignObject width="10" height="10"/>'), { textBackground: '#fffdf5' }))
      .toContain('fill="#fffdf5"');
  });
});

describe('documents it should not damage', () => {
  it.each([
    ['empty', ''],
    ['not markup', 'hello'],
    ['no shapes', '<svg><title>t</title></svg>'],
  ])('returns %s unchanged', (_name, source) => {
    expect(roughen(source)).toBe(source);
  });

  it('keeps the stylesheet, the labels and the markers of a real document', () => {
    const fixture = fs.readFileSync(FIXTURE, 'utf8');
    const out = roughen(fixture, { seed: 1 });
    expect(count(out, /<marker /g)).toBe(count(fixture, /<marker /g));
    expect(count(out, /<foreignObject/g)).toBe(count(fixture, /<foreignObject/g));
    expect(out).toContain('resolve the CSS cascade');
    expect(count(out, /<rect class="basic/g)).toBe(0);
  });
});
