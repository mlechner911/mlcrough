/**
 * The parser's contract is not "understands XML" — it is "gives back exactly
 * what it was given, apart from what a caller replaced". Every test here is
 * about that promise, because it is what lets roughen() run over a foreign
 * document without quietly rewriting the parts it does not understand.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseXml, serializeXml, XmlElement, XmlNode } from '../src/xml.js';

const roundTrips = (source: string): void => {
  expect(serializeXml(parseXml(source))).toBe(source);
};

/** Depth-first list of every element in the tree. */
function elements(nodes: XmlNode[]): XmlElement[] {
  const found: XmlElement[] = [];
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    found.push(node);
    found.push(...elements(node.children));
  }
  return found;
}

describe('round trip', () => {
  it('returns a plain document unchanged', () => {
    roundTrips('<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2"/></svg>');
  });

  it('preserves whitespace, attribute quoting and attribute order', () => {
    roundTrips(`<svg  a='1'   b="2"
      c=3 d ><g/>\n  </svg>`);
  });

  it('preserves comments, CDATA, the XML declaration and the doctype', () => {
    roundTrips('<?xml version="1.0"?><!DOCTYPE svg><!-- hi --><svg><![CDATA[a < b]]></svg>');
  });

  it('preserves entity references rather than decoding them', () => {
    roundTrips('<svg><desc>a &amp; b &#169; c</desc></svg>');
  });

  it('does not invent closing tags for unclosed elements', () => {
    // Not valid XML, and deliberately not repaired: emitting the </g></rect>
    // the document never had would be a rewrite, not a round trip.
    roundTrips('<svg><g><rect x="1"></svg>');
    roundTrips('<svg><style>a{}');
  });

  it('keeps a stray closing tag as text', () => {
    roundTrips('<svg></g></svg>');
  });

  it('round-trips the Mermaid fixture byte for byte', () => {
    const fixture = fs.readFileSync(
      path.join(import.meta.dirname, '../examples/svg-in/mermaid-pipeline.svg'), 'utf8');
    roundTrips(fixture);
  });
});

describe('attributes', () => {
  it('reads values in single quotes, double quotes and bare', () => {
    const [, el] = elements(parseXml('<svg><rect a="1" b=\'2\' c=3 d/></svg>'));
    expect(el.attrs).toEqual({ a: '1', b: '2', c: '3', d: '' });
  });

  it('reads attributes of a nested element, not of its ancestor', () => {
    // Regression: the attribute reader was handed an absolute offset for a
    // string that had already been sliced, so every element but the root
    // parsed as having no attributes at all.
    const [, rect] = elements(parseXml('<svg width="10"><rect x="7" fill="#eee"/></svg>'));
    expect(rect.tag).toBe('rect');
    expect(rect.attrs).toEqual({ x: '7', fill: '#eee' });
  });

  it('does not treat > inside an attribute value as the end of the tag', () => {
    const [el] = elements(parseXml('<svg data-x="a > b"><g/></svg>'));
    expect(el.attrs['data-x']).toBe('a > b');
    expect(el.children.filter((c) => c.type === 'element')).toHaveLength(1);
  });
});

describe('opaque elements', () => {
  it('does not parse markup inside <style>', () => {
    const [, style] = elements(parseXml('<svg><style>a { content: "<b>" }</style></svg>'));
    expect(style.tag).toBe('style');
    expect(style.children).toHaveLength(1);
    expect(style.children[0]).toEqual({ type: 'raw', text: 'a { content: "<b>" }' });
  });

  it('does not parse the HTML inside <foreignObject>', () => {
    // Mermaid puts its labels here, and HTML may leave <br> unclosed — which
    // would derail a parser that treated it as markup.
    const source = '<svg><foreignObject width="10"><div>a<br>b</div></foreignObject><rect/></svg>';
    const tags = elements(parseXml(source)).map((e) => e.tag);
    expect(tags).toEqual(['svg', 'foreignObject', 'rect']);
    roundTrips(source);
  });
});

describe('degenerate input', () => {
  it.each([
    ['empty', ''],
    ['no markup', 'hello'],
    ['a lone angle bracket', 'a < b'],
    ['an unterminated tag', '<svg'],
    ['an unterminated comment', '<svg><!-- oops'],
  ])('round-trips %s', (_name, source) => {
    roundTrips(source);
  });
});
