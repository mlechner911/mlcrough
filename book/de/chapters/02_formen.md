# Kapitel 2: Formen zeichnen

```bash
npm install mlcrough
```

Ein Renderer, eine Form, eine Zeichenkette:

```typescript
import mlcrough from 'mlcrough';

const rc = mlcrough.svgString();
const svg = mlcrough.serialize(rc.circle(100, 100, 120));
```

`svgString()` liefert einen Renderer, der abstrakte Knoten erzeugt;
`serialize()` macht daraus Text. Die Trennung ist Absicht: Wer die Knoten
lieber selbst weiterverarbeitet — in ein größeres Dokument einhängen, Attribute
ergänzen —, kommt an sie heran, ohne den Umweg über eine Zeichenkette und
zurück.

Die Formen sind `line`, `rectangle`, `circle`, `ellipse`, `linearPath`,
`polygon`, `arc`, `curve` und `path`. Jede nimmt als letztes Argument
denselben Optionen-Block.

## Was die Zeichnung aussehen lässt, wie sie aussieht

Zwei Werte tragen fast den ganzen Eindruck.

**`roughness`** ist die Abweichung von der Ideallinie. 0 zeichnet exakt, 1 ist
der Standard, darüber wird es zunehmend nervös.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/roughness.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:4.645">
<img src="/books/mlcrough/images/roughness.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:4.645" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Dasselbe Rechteck, derselbe Seed, fünf Werte für <code>roughness</code>. Ab 2 sieht es weniger nach Skizze aus als nach unsicherer Hand.</figcaption>
</figure>

**`bowing`** ist die Durchbiegung gerader Linien. Und hier steht eine Falle, die
man einmal erlebt haben muss: *`bowing` wirkt proportional zur Länge der Linie.*
Der Wert, der eine 80 Pixel lange Kante angenehm wellig macht, biegt eine 400
Pixel lange Achse zu einem sichtbaren Bogen. In einem Diagramm mit kurzen
Kästen und langen Achsen braucht man deshalb zwei Werte, nicht einen — wie das
geht, steht in Kapitel 3.

## Der Seed

Ohne Angabe zeichnet die Bibliothek bei jedem Lauf anders. Das ist für ein
Skizzenwerkzeug die richtige Voreinstellung: zweimal dasselbe von Hand gezeichnet
ist eben nicht zweimal dasselbe.

Sobald die Ausgabe aber in ein Repository, in einen Build oder in ein Handbuch
wandert, ist es die falsche. Ein `seed` macht die Zeichnung reproduzierbar:

```typescript
rc.rectangle(10, 10, 200, 120, { fill: '#7c3aed', seed: 42 });
```

Derselbe Seed, dieselbe Form, dieselben Bytes. Alle Abbildungen in diesem
Handbuch entstehen so — sonst zeigte jeder Neubau der Seite ein anderes Bild und
jeder Commit einen Diff.

## Weitere Optionen

| Option | Wirkung |
| :--- | :--- |
| `stroke`, `strokeWidth` | Farbe und Breite der Kontur. `stroke: 'none'` lässt sie weg. |
| `fill`, `fillStyle` | Füllfarbe und Füllart — siehe Kapitel 4. |
| `hachureAngle`, `hachureGap` | Winkel und Abstand der Schraffurlinien. |
| `fillWeight` | Strichstärke der Füllung. Voreingestellt die halbe `strokeWidth`. |
| `strokeLineDash` | Strichmuster der Kontur, wie in SVG. |
| `preserveVertices` | Lässt Eckpunkte an ihrem Platz, statt auch sie zu verwackeln. |
| `disableMultiStroke` | Zeichnet jede Linie einmal statt zweimal. |
| `fixedDecimalPlaceDigits` | Nachkommastellen in der Ausgabe — kleinere Dateien. |

Ein Renderer kann seine Voreinstellungen einmal bekommen, statt sie bei jeder
Form zu wiederholen:

```typescript
const rc = mlcrough.svgString({ options: { roughness: 1.4, seed: 7 } });
```
