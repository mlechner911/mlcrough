# Kapitel 4: Füllungen

Eine handgezeichnete Fläche ist selten einfarbig. Sie ist schraffiert,
gekreuzelt, getupft — und welche dieser Arten man wählt, entscheidet mehr über
den Eindruck als die Farbe.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/fills.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:1.81">
<img src="/books/mlcrough/images/fills.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:1.81" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Elf Füllstile, dieselbe Form, dieselbe Farbe.</figcaption>
</figure>

`hachure` ist die Voreinstellung und die Grundform: parallele Linien in einem
Winkel. `solid` füllt durch — nicht als Rechteck, sondern als einmal
nachgezogene Fläche, die Kante wackelt also weiterhin. Alles dazwischen variiert
die Linienführung: `zigzag` und `zigzag-line` ziehen hin und zurück,
`cross-hatch` legt eine zweite Schraffur quer, `dashed` unterbricht, `dots` und
`multi-dots` tupfen, `multi-hachure` überlagert mehrere Winkel.

`gradient` und `radial-gradient` sind keine SVG-Verläufe. Sie variieren die
Deckkraft der Schraffurlinien über die Fläche — ein Verlauf, wie ihn ein Stift
erzeugt, nicht wie ihn ein Renderer erzeugt.

## Drei Werte, die zusammenspielen

`hachureGap` ist der Abstand der Linien, `hachureAngle` ihr Winkel,
`fillWeight` ihre Stärke.

`fillWeight` steht voreingestellt auf −1, was bedeutet: *nimm die halbe
`strokeWidth`.* Das ist meistens richtig und einmal falsch — nämlich wenn die
Form gar keine Kontur hat. Diagrammbibliotheken erzeugen für ihre Flächen genau
das: `fill` gesetzt, `stroke: none`. Vor Version 5.3.0 kam dabei eine Schraffur
mit Strichstärke 0 heraus, die Füllung verschwand also. Seitdem behält die
Breite ihren Wert, auch wenn keine Kontur gezeichnet wird.

## Schraffur trägt weniger Farbe als eine Fläche

Ein Wert, der als durchscheinende Vollfläche gut aussieht — sagen wir 40 %
Deckkraft —, bedeckt als Schraffur nur einen Bruchteil derselben Fläche. Vom
Eindruck bleibt fast nichts.

Wer ein Diagramm mit Flächen skizzieren lässt, dreht deshalb an zwei Schrauben:
kräftigere Farben in der Quelle, und in den Optionen ein engeres `hachureGap`
mit etwas mehr `fillWeight`.

```typescript
mlcrough.roughen(chart, { fillStyle: 'hachure', hachureGap: 5, fillWeight: 1.1 });
```

## Was Punkte kosten

`dots` und `multi-dots` zeichnen pro Punkt eine eigene, ebenfalls
handgezeichnete Ellipse. Bei engem Abstand wird das schnell groß: Die Abbildung
oben wog mit `hachureGap: 6` allein 600 kB und mit 12 noch 165 kB — der Rest der
Stile trägt zusammen weniger als ein Zehntel davon bei.

Für eine Bildschirmdarstellung ist das gleichgültig, für eine Seite mit vielen
Grafiken nicht. Wer Punkte großflächig einsetzt, sollte den Abstand prüfen und
`fixedDecimalPlaceDigits` niedrig halten.

## Verläufe und Muster aus dem Quelldokument

Steht im Quelldokument eine Referenz — `fill="url(#verlauf)"` —, kann eine
Schraffur sie nicht abbilden: Jede Linie trüge denselben Verlauf noch einmal.
`roughen()` erkennt solche Füllungen und zeichnet sie als eine einzige Fläche
mit dieser Referenz. Die Kante wackelt, der Verlauf bleibt heil.
