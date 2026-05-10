import rough from '../src/rough';

const rc = rough.svgString();
const shape = rc.rectangle(10, 10, 280, 280, {
  fill: 'red',
  hachureGap: 1.7
});

const svg = `
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  ${rough.serialize(shape)}
</svg>
`;

console.log(svg.trim());
