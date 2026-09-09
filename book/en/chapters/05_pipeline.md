# Chapter 5: In a pipeline

The interesting inputs for `roughen()` are produced by another program. Which is
why the library also comes as a command line tool.

```bash
npx mlcrough diagram.svg -o sketch.svg
npx mlcrough --fill-style solid --roughness 2 chart.svg > sketch.svg
cat chart.svg | npx mlcrough --seed 0 > sketch.svg
```

Which makes the whole thing one line in a Makefile:

```bash
mmdc -i graph.mmd -o graph.svg && mlcrough graph.svg -o sketch.svg
```

Options take both spellings, `--flag value` and `--flag=value`. The attached
form is what you need where a value may be left out: `--text-background` alone
means white, `--text-background=#fffdf5` a colour. `mlcrough --help` lists
everything.

## No browser, one process

When the producing tool is itself a JavaScript library without a DOM
dependency, even the intermediate file goes away:

```typescript
import { MLTimeGraph, SVGRenderer } from 'ml-time-graph';
import mlcrough from 'mlcrough';

const chart = new MLTimeGraph({ width: 760, height: 380, series });
const { content } = new SVGRenderer().render(chart.renderCommands());

const sketch = mlcrough.roughen(content, { roughness: 1.3, seed: 7 });
```

Data → chart → SVG → sketch, as a sequence of function calls. No headless
Chrome, no temporary file, nothing to wait for. The chart in chapter 3 is made
exactly this way.

## Figures that cannot go stale

Every picture in this manual is produced by a script that uses the same code
paths as the library's examples. That is not a flourish but the only
construction in which a manual does not slowly become wrong: a pasted screenshot
stops being true after the next release, and nobody notices.

Two things have to come together for that to hold. First a fixed seed, or every
run produces a different picture and every build a diff — which is why
`roughen()` has one by default. Second a check that fires when someone changes
the code and not the pictures: this project's CI regenerates them and fails if
anything moves.

## Two versions for two grounds

This site is dark by default and light on request. A picture made for one of
them looks wrong in the other — most obviously as a white box on a dark ground.

So the figures exist twice: the plain name carries the dark version,
`<name>.light.svg` the other. Neither has a background of its own; the page
supplies it. Where the colours come from the source document — with Mermaid, for
instance — this takes two runs of the producing tool, because its theme is baked
into the document.

## Limits

Three things `roughen()` cannot do today, and knowing them beats discovering
them:

- **`<use>` is skipped.** If you reference an element instead of writing it out
  — exports from Figma, Illustrator and Inkscape like to — it comes back
  unchanged. The result is then half sketched, which is more awkward than a
  clean failure.
- **Relative measurements are passed over.** A shape with `width="50%"` stays as
  it is: there is no viewport here to resolve that against.
- **External stylesheets are not fetched.** What is resolved is what stands in
  the document.
