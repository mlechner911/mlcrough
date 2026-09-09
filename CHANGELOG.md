# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.3.1] — 2026-09-09

### Fixed

- **`seed` did not govern pattern fills.** Fillers were cached at module level,
  so each one held on to the render helper — and therefore the randomizer — of
  whichever call happened to build it first. Outlines stayed reproducible while
  fills drifted with every further call in the same process, and a fixed seed
  did not reproduce them. Fillers are now built per fill.
- The `dots` fill style called `Math.random()` directly and so ignored `seed`
  entirely.
- `polygonHachureLines` fell back to `Math.random()` whenever the seeded
  randomizer legitimately returned `0`.
- The XML reader emitted a closing tag for elements the source never closed,
  which broke the round-trip guarantee on malformed input.

## [5.3.0] — 2026-09-09

### Added

- **`roughen(svg, options)`** — redraws every shape of an existing SVG document
  in a hand-drawn style. `rect`, `circle`, `ellipse`, `line`, `polyline`,
  `polygon` and `path` are replaced in place; text, markers, gradients and the
  surrounding markup are passed through byte for byte. Colours are resolved
  through the cascade, including the `<style>` block that generated documents
  keep their real styling in — without which every shape would come out in the
  SVG default of black.
- **A command line tool**, `mlcrough diagram.svg -o sketch.svg`, also reading
  standard input. Flags take either `--flag value` or `--flag=value`.
- **`onShape`**, called for every shape before it is redrawn: return extra
  options for that shape alone, or `false` to leave the element untouched.
- **`textBackground`**, laying a plate of colour behind every label so text
  stays readable where a hachure fill runs under it.
- **`padding`**, growing the root `viewBox` so sketched strokes are not clipped
  by a viewport cropped exactly to its content. Defaults to `2 + 2 * roughness`.
- A Vite playground (`npm run dev`) showing a source document and its sketched
  result side by side.

### Fixed

- A filled shape carrying no stroke of its own was drawn in hachure lines of
  width `0`, i.e. invisibly. Chart libraries emit exactly that for fill areas.

### Changed

- The published tarball is built from a `files` allowlist and no longer carries
  `test-output/`: 152 kB instead of 1.8 MB.

## [5.2.0]

Never published to npm.

- `points-on-path` and `path-data-parser` inlined and their regular expressions
  modernized, so the library runs on strict-ES engines that reject the
  deprecated `RegExp.$1` globals.

## [5.1.0] — 2026-05-10

- `multi-dots` fill style with randomized opacity.
- Sketchy `gradient` and `radial-gradient` fill styles.

## [5.0.0]

First modernized release of the [Rough.js](https://github.com/pshihn/rough)
fork, continuing that project's version numbering from 4.6.6.

- All DOM and Canvas dependencies removed: the library runs in Node, in SSR and
  in workers.
- Re-architected as a pure ES module, TypeScript throughout.

[5.3.1]: https://github.com/mlechner911/mlcrough/releases/tag/v5.3.1
[5.3.0]: https://github.com/mlechner911/mlcrough/releases/tag/v5.3.0
[5.1.0]: https://github.com/mlechner911/mlcrough/releases/tag/v5.1.0
