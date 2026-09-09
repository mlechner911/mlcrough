# Chapter 3: Redrawing a finished SVG

```typescript
const sketch = mlcrough.roughen(svgText, { roughness: 1.4 });
```

One function, a document in, a document out. What happens in between is worth
knowing, mostly because two parts of it are not obvious.

## What is replaced and what is not

Replaced are `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` and
`path`. Each gives way to a group of hand-drawn paths — **at exactly the same
place in the tree.** That is the trick that keeps the whole approach simple: the
replacement sits where the original sat, so every `transform` on the groups
above it still applies. No coordinate has to be recomputed.

Everything else comes back untouched — text, the markup around it, comments,
entity references, even the quoting of attributes.

Also left alone is anything used by reference: `defs`, `marker`, `clipPath`,
`mask`, `pattern`, `symbol`. A hand-drawn arrowhead would be redrawn at *every*
position that references it, and a wobbling clip path no longer clips cleanly.
Pass `includeDefs: true` if that is what you want.

## The colours are not on the elements

This is where a naive implementation fails. Mermaid writes its nodes like this:

```html
<rect class="basic label-container" x="-130" y="-39" width="260" height="78"/>
```

No fill, no stroke, nothing. The colours live in a stylesheet shipped inside the
same document:

```css
#my-svg .node rect, … { fill:#ECECFF; stroke:#9370DB; stroke-width:1px; }
```

Read only the attribute and you find nothing — and land on the SVG default,
which is **black**. A flowchart would come out as a heap of black boxes.

So `roughen()` resolves the cascade before it draws anything: presentation
attributes, embedded `<style>` rules with specificity and source order,
inherited properties, `!important`, and finally the element's `style` attribute.

Not supported, and **skipped rather than guessed at**: sibling combinators
(`+`, `~`), pseudo-classes, and conditional groups such as `@media`. An ignored
rule paints nothing; a half-understood one paints the wrong thing.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/chart.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:2.111">
<img src="/books/mlcrough/images/chart.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:2.111" aria-hidden="true">
</div>
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/chart_rough.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:2.083">
<img src="/books/mlcrough/images/chart_rough.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:2.083" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Above, a chart from <a href="/books/mlctimegraph/">ml-time-graph</a>; below, the same one through <code>roughen()</code>. Labels, ticks and the threshold caption stay exactly where they were — <code>&lt;text&gt;</code> is never touched.</figcaption>
</figure>

## Not every shape wants the same hand

In the chart above the axes are straight and the curve wavers. That is not luck
but the answer to the `bowing` trap from chapter 2: the value that gives the data
curve a pleasant waver bends the 320-pixel axis into an arc.

`onShape` is called for every shape before it is drawn. What it returns is extra
options for that one shape — or `false`, and the element is left alone.

```typescript
mlcrough.roughen(chart, {
  roughness: 1.3,
  bowing: 1,
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
});
```

The axes and ticks are `<line>`, the curve and its fills are `<path>` — telling
them apart costs one comparison. The callback also receives `attrs`, the
computed `style` and a running `index`, so you can just as well distinguish by
class, colour or position.

## The margin

Generated SVG is cropped exactly to its content. A hand-drawn line, though,
wanders a few pixels beside the shape it stands for — and so outside the
`viewBox`, where it is clipped.

`roughen()` therefore grows the `viewBox` on its own, by `2 + 2 * roughness`
units by default. `padding: 0` turns that off.

## Labels over hachure

A solid fill sits behind the text. Hachure runs *through* it, and depending on
the spacing the text turns restless.

```typescript
mlcrough.roughen(svg, { textBackground: true });                       // white
mlcrough.roughen(svg, { textBackground: '#fffdf5' });                  // a colour
mlcrough.roughen(svg, { textBackground: { fill: '#fff', padding: 1.5, opacity: 0.85 } });
```

How exactly the plate fits depends on what is under it. A `<foreignObject>` —
which is where Mermaid puts its labels — states its own width and height, so
that case is exact. A `<text>` does not, and computing its real extent needs
font metrics: precisely what a library without a DOM and without a canvas does
not have. There the box is estimated from the font size and the number of
characters, at 0.55 em average advance width. That carries for an ordinary
proportional face and sits visibly wrong for a condensed or monospaced one.

## Reproducibility

Unlike the drawing functions of chapter 2, `roughen()` has **a fixed seed by
default**. The same input text yields the same bytes, run after run. That is the
right default for a filter in a pipeline: otherwise every build would produce a
diff. `seed: 0` switches to a fresh sketch on every run.
