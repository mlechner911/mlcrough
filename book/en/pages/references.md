# References

## The package

| Part | Where | Version |
| :--- | :--- | :--- |
| Library and CLI | [`mlcrough`](https://www.npmjs.com/package/mlcrough) on npm | 5.3.1 |

Without a bundler it works too, over a CDN:

```html
<script type="module">
  import mlcrough from 'https://unpkg.com/mlcrough';
</script>
```

## In the repository

[github.com/mlechner911/mlcrough](https://github.com/mlechner911/mlcrough)

- `src/roughen.ts` — the transform from chapter 3
- `src/css.ts` — the cascade resolution, without which the colours could not be found
- `src/xml.ts` — the reader that gives back everything untouched, byte for byte
- `src/fillers/` — the eleven fill styles of chapter 4
- `examples/` — every example in this manual as a runnable script
- `playground/` — source and result side by side, with sliders (`npm run dev`)
- `bin/render-book-images.ts` — produces the figures of this manual

## Origin

MLCRough is a fork of [Rough.js](https://github.com/pshihn/rough) by Preet
Shihn, MIT licensed. The way of drawing comes from there; what was added is
independence from the DOM and canvas, `roughen()`, the command line tool and the
additional fill styles. Version numbering continues the original's, which is why
this manual starts at 5.3 rather than 1.0.

## Related

- [MLTimeGraph](https://mlcgo.eu/books/mlctimegraph/) — the charts that go
  through `roughen()` in chapters 3 and 5. Also DOM-free, which is why the two
  can be chained inside one process.
- [MLC Isometric Heatmap](https://mlcgo.eu/books/mlcheatmap/) — the same idea of
  server-rendered SVG, applied to patterns across two axes.

## Licence

The library is MIT; this manual is
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
