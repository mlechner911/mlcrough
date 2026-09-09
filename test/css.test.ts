/**
 * The cascade resolver exists for one reason: generated SVG puts its colours
 * in a stylesheet, not on the elements. If it gets specificity or inheritance
 * wrong, every shape comes out the wrong colour — so the rules it implements,
 * and the ones it deliberately refuses, are worth pinning down.
 */
import { describe, expect, it } from 'vitest';
import { cascade, parseInlineStyle, parseStylesheet, StyledElement } from '../src/css.js';

const el = (tag: string, attrs: Record<string, string> = {}): StyledElement => ({ tag, attrs });

/** Resolves `css` against an ancestor chain given root-first. */
const resolve = (css: string, stack: StyledElement[]): Record<string, string> =>
  cascade(parseStylesheet(css), stack);

describe('selector matching', () => {
  it('matches a tag, a class and an id', () => {
    const stack = [el('rect', { class: 'box wide', id: 'r1' })];
    expect(resolve('rect { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('.wide { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('#r1 { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('.missing { fill: red }', stack)).toEqual({});
  });

  it('requires every class of a compound selector', () => {
    const stack = [el('rect', { class: 'box' })];
    expect(resolve('.box.wide { fill: red }', stack)).toEqual({});
  });

  it('matches a descendant at any depth, a child only directly', () => {
    const stack = [el('svg'), el('g', { class: 'node' }), el('g'), el('rect')];
    expect(resolve('.node rect { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('.node > rect { fill: red }', stack)).toEqual({});
    expect(resolve('g > rect { fill: red }', stack)).toEqual({ fill: 'red' });
  });

  it('resolves the shape Mermaid actually emits', () => {
    // The real thing: an id on the root, a class on the group, a bare tag at
    // the end — and nothing at all on the element itself.
    const css = '#my-svg .node rect,#my-svg .node polygon{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}';
    const stack = [el('svg', { id: 'my-svg' }), el('g', { class: 'node default' }), el('rect', { class: 'basic' })];
    expect(resolve(css, stack)).toEqual({ fill: '#ECECFF', stroke: '#9370DB', 'stroke-width': '1px' });
  });

  it('matches attribute selectors, present and by value', () => {
    const stack = [el('rect', { 'data-look': 'neo' })];
    expect(resolve('[data-look] { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('[data-look="neo"] { fill: red }', stack)).toEqual({ fill: 'red' });
    expect(resolve('[data-look="flat"] { fill: red }', stack)).toEqual({});
  });
});

describe('cascade order', () => {
  it('lets the more specific selector win regardless of source order', () => {
    const stack = [el('rect', { class: 'box', id: 'r1' })];
    expect(resolve('#r1 { fill: a } .box { fill: b } rect { fill: c }', stack)).toEqual({ fill: 'a' });
  });

  it('lets the later rule win at equal specificity', () => {
    const stack = [el('rect')];
    expect(resolve('rect { fill: a } rect { fill: b }', stack)).toEqual({ fill: 'b' });
  });

  it('lets !important beat a more specific rule', () => {
    const stack = [el('rect', { id: 'r1' })];
    expect(resolve('#r1 { fill: a } rect { fill: b !important }', stack)).toEqual({ fill: 'b' });
  });
});

describe('what it refuses', () => {
  it.each([
    ['a sibling combinator', 'g + rect { fill: red }'],
    ['a pseudo-class', 'rect:hover { fill: red }'],
    ['a substring attribute matcher', '[class*="bo"] { fill: red }'],
  ])('skips %s rather than guessing', (_name, css) => {
    // Skipping is the safe failure: an unsupported rule that is ignored paints
    // nothing, while one that is half-matched paints the wrong thing.
    expect(parseStylesheet(css)).toHaveLength(0);
  });

  it('ignores at-rules, including their nested blocks', () => {
    const css = '@media print { rect { fill: red } } @keyframes d { to { opacity: 0 } } rect { fill: blue }';
    expect(resolve(css, [el('rect')])).toEqual({ fill: 'blue' });
  });
});

describe('declaration parsing', () => {
  it('keeps commas inside a function intact', () => {
    expect(parseInlineStyle('fill: rgba(1, 2, 3, 0.5); stroke: red'))
      .toEqual({ fill: 'rgba(1, 2, 3, 0.5)', stroke: 'red' });
  });

  it('strips comments', () => {
    expect(resolve('rect { /* nope */ fill: red }', [el('rect')])).toEqual({ fill: 'red' });
  });
});
