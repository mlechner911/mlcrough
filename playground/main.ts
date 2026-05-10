import rough from '../src/rough';
import { SVGNode } from '../src/core';

const svg = document.getElementById('svg') as unknown as SVGSVGElement;

// 1. Existing DOM approach
const rc = rough.svg(svg);
svg.appendChild(rc.rectangle(10, 10, 100, 100, { fill: 'rgba(255,0,0,0.2)' }));

// 2. New Textual approach
const rcString = rough.svgString();
const node = rcString.circle(200, 100, 80, { fill: 'blue' });

// Helper to convert SVGNode to string
function nodeToString(node: SVGNode): string {
  const attrs = Object.keys(node.attributes).map(k => k + '="' + node.attributes[k] + '"').join(' ');
  const children = node.children.map(nodeToString).join('');
  return '<' + node.tag + ' ' + attrs + '>' + children + '</' + node.tag + '>';
}

const svgString = nodeToString(node);
console.log('Generated SVG String:', svgString);

// Injecting the generated string back into DOM to verify it works
const parser = new DOMParser();
const doc = parser.parseFromString('<svg xmlns="http://www.w3.org/2000/svg">' + svgString + '</svg>', 'image/svg+xml');
const importedNode = document.importNode(doc.documentElement.firstChild!, true);
svg.appendChild(importedNode);

// More examples
svg.appendChild(rc.ellipse(400, 100, 150, 80, { fill: 'green', hachureAngle: 60, hachureGap: 8 }));
