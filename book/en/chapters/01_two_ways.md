# Chapter 1: Two ways in

MLCRough draws the way a person with a pen draws: lines do not quite meet, edges
are gone over twice, areas are hatched rather than filled. The library is a fork
of [Rough.js](https://github.com/pshihn/rough) by Preet Shihn, and that part
comes from there.

What was added here is two things. The first is a removal: **every dependency on
the DOM and on canvas is gone.** The library produces strings, not elements. So
it runs in Node, in the browser, in a worker, in a build step.

The second follows from that, and is the reason this manual exists.

## The first way: describe shapes

You tell the library what to draw.

```typescript
import mlcrough from 'mlcrough';

const rc = mlcrough.svgString();
const node = rc.rectangle(10, 10, 200, 120, { fill: '#7c3aed' });

console.log(mlcrough.serialize(node));
```

Out comes a group of paths — not a `<rect>`, because a hand-drawn rectangle is
no longer one. Four edges, each drawn twice and each a little off, plus the
hatching of the fill.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/shapes.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:3.6">
<img src="/books/mlcrough/images/shapes.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:3.6" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Rectangle, circle, polygon and a path, each with a different fill style. Chapter 2 goes through the shapes one by one.</figcaption>
</figure>

## The second way: hand it a finished SVG

The first way assumes the drawing is yours to make. Often it is not. The diagram
comes out of Mermaid, the graph out of Graphviz, the chart out of a charting
library — finished SVG that just needs to look different.

```typescript
const sketch = mlcrough.roughen(svgText, { roughness: 1.4 });
```

`roughen()` reads a finished document, replaces every shape with its hand-drawn
counterpart and leaves everything else alone. This is where the removed DOM
dependency stops being a detail and becomes the precondition: the interesting
inputs are produced by other programs, and the whole chain has to run on a
server, in a pipeline or in a documentation build — without a browser.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/pipeline_rough.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;max-width:460px;display:block;margin:0 auto;aspect-ratio:0.703">
<img src="/books/mlcrough/images/pipeline_rough.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;max-width:460px;display:block;margin:0 auto;aspect-ratio:0.703" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">What <code>roughen()</code> does, drawn by Mermaid — and then by <code>roughen()</code>. Chapter 3 walks through this.</figcaption>
</figure>

## What this manual does not claim

A sketched drawing is not decoration. It says something, and what it says is:
*this is provisional.* A draft, an estimate, a proposal still being discussed.
For a measurement report or a balance sheet it is the wrong choice — there the
clean line rightly claims precision.

The value lies exactly where the clean line promises too much.
