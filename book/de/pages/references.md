# Referenzen

## Das Paket

| Teil | Wo | Version |
| :--- | :--- | :--- |
| Bibliothek und CLI | [`mlcrough`](https://www.npmjs.com/package/mlcrough) auf npm | 5.3.1 |

Ohne Bündler geht es auch, über einen CDN:

```html
<script type="module">
  import mlcrough from 'https://unpkg.com/mlcrough';
</script>
```

## Im Repository

[github.com/mlechner911/mlcrough](https://github.com/mlechner911/mlcrough)

- `src/roughen.ts` — die Transformation aus Kapitel 3
- `src/css.ts` — die Kaskaden-Auflösung, ohne die die Farben nicht zu finden wären
- `src/xml.ts` — der Leser, der alles Unangetastete byteweise zurückgibt
- `src/fillers/` — die elf Füllstile aus Kapitel 4
- `examples/` — jedes Beispiel des Handbuchs als lauffähiges Skript
- `playground/` — Original und Ergebnis nebeneinander, mit Reglern (`npm run dev`)
- `bin/render-book-images.ts` — erzeugt die Abbildungen dieses Handbuchs

## Herkunft

MLCRough ist ein Fork von [Rough.js](https://github.com/pshihn/rough) von Preet
Shihn, MIT-lizenziert. Von dort stammt die Art zu zeichnen; hinzugekommen sind
die Unabhängigkeit von DOM und Canvas, `roughen()`, das
Kommandozeilenwerkzeug und die zusätzlichen Füllstile. Die Versionszählung
setzt die des Originals fort, weshalb dieses Handbuch bei 5.3 beginnt und nicht
bei 1.0.

## Verwandtes

- [MLTimeGraph](https://mlcgo.eu/books/mlctimegraph/) — die Diagramme, die in
  Kapitel 3 und 5 durch `roughen()` gehen. Ebenfalls ohne DOM, weshalb sich
  beide in einem Prozess verketten lassen.
- [MLC Isometric Heatmap](https://mlcgo.eu/books/mlcheatmap/) — dieselbe Idee
  von serverseitig erzeugtem SVG, angewandt auf Muster über zwei Achsen.

## Lizenz

Die Bibliothek steht unter MIT, dieses Handbuch unter
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
