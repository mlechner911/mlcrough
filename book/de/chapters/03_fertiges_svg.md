# Kapitel 3: Ein fertiges SVG nachzeichnen

```typescript
const skizze = mlcrough.roughen(svgText, { roughness: 1.4 });
```

Eine Funktion, ein Dokument hinein, ein Dokument heraus. Was dazwischen
passiert, lohnt sich zu wissen — vor allem, weil zwei Dinge daran nicht
offensichtlich sind.

## Was ersetzt wird und was nicht

Ersetzt werden `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` und
`path`. Jede dieser Formen weicht einer Gruppe handgezeichneter Pfade — **an
genau derselben Stelle im Baum.** Das ist der Trick, der den ganzen Ansatz
einfach hält: Der Ersatz sitzt dort, wo das Original saß, also gelten alle
`transform`-Attribute der umgebenden Gruppen unverändert weiter. Keine
Koordinate muss umgerechnet werden.

Alles andere kommt unangetastet zurück — Text, das Markup ringsum, Kommentare,
Entity-Referenzen, sogar die Anführungszeichen der Attribute.

Nicht angefasst wird außerdem, was per Referenz benutzt wird: `defs`, `marker`,
`clipPath`, `mask`, `pattern`, `symbol`. Eine handgezeichnete Pfeilspitze würde
an *jeder* Stelle neu gezeichnet, die sie referenziert, und ein verwackelter
Clip-Pfad schneidet nicht mehr sauber. Wer es trotzdem will, setzt
`includeDefs: true`.

## Die Farben stehen nicht an den Elementen

Das ist die Stelle, an der eine naive Umsetzung scheitert. Mermaid schreibt
seine Knoten so:

```html
<rect class="basic label-container" x="-130" y="-39" width="260" height="78"/>
```

Keine Füllung, keine Kontur, nichts. Die Farben stehen in einem Stylesheet, das
im selben Dokument mitgeliefert wird:

```css
#my-svg .node rect, … { fill:#ECECFF; stroke:#9370DB; stroke-width:1px; }
```

Wer hier nur das Attribut liest, findet nichts — und landet bei der
SVG-Voreinstellung, die **schwarz** ist. Ein Ablaufdiagramm käme als Ansammlung
schwarzer Kästen heraus.

`roughen()` löst deshalb die Kaskade auf, bevor es irgendetwas zeichnet:
Präsentationsattribute, eingebettete `<style>`-Regeln mit Spezifität und
Quellreihenfolge, geerbte Eigenschaften, `!important`, und zuletzt das
`style`-Attribut am Element.

Nicht unterstützt und **bewusst übersprungen statt geraten**: Geschwister-
Kombinatoren (`+`, `~`), Pseudoklassen und bedingte Gruppen wie `@media`. Eine
ignorierte Regel malt nichts; eine halb verstandene malt das Falsche.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/chart.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:2.111">
<img src="/books/mlcrough/images/chart.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:2.111" aria-hidden="true">
</div>
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/chart_rough.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:2.083">
<img src="/books/mlcrough/images/chart_rough.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:2.083" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Oben ein Diagramm von <a href="/books/mlctimegraph/">ml-time-graph</a>, unten dasselbe durch <code>roughen()</code>. Beschriftungen, Ticks und die Schwellenmarkierung stehen unverändert an ihrem Platz — <code>&lt;text&gt;</code> wird nie angefasst.</figcaption>
</figure>

## Nicht jede Form will dieselbe Hand

Im Diagramm oben sind die Achsen gerade und die Kurve zittert. Das ist kein
Zufall, sondern die Antwort auf die `bowing`-Falle aus Kapitel 2: Der Wert, der
die Datenkurve angenehm wellt, biegt die 320 Pixel lange Achse zum Bogen.

`onShape` wird für jede Form aufgerufen, bevor sie gezeichnet wird. Der
Rückgabewert sind zusätzliche Optionen nur für diese eine Form — oder `false`,
dann bleibt das Element unberührt.

```typescript
mlcrough.roughen(chart, {
  roughness: 1.3,
  bowing: 1,
  onShape: ({ tag }) => (tag === 'line' ? { bowing: 0, roughness: 0.7 } : undefined),
});
```

Die Achsen und Ticks sind `<line>`, die Kurve und ihre Flächen sind `<path>` —
die Unterscheidung kostet einen Vergleich. Der Rückgabewert bekommt außerdem
`attrs`, den berechneten `style` und einen laufenden `index`, man kann also
auch nach Klasse, Farbe oder Position unterscheiden.

## Der Rand

Erzeugte SVGs sind exakt auf ihren Inhalt beschnitten. Eine handgezeichnete
Linie läuft aber ein paar Pixel neben die Form, für die sie steht — und damit
aus der `viewBox` heraus, wo sie abgeschnitten wird.

`roughen()` vergrößert die `viewBox` deshalb von sich aus, voreingestellt um
`2 + 2 * roughness` Einheiten. `padding: 0` schaltet das ab.

## Beschriftungen über der Schraffur

Eine Vollfläche liegt hinter dem Text. Schraffur läuft *durch* ihn hindurch, und
je nach Dichte wird er unruhig.

```typescript
mlcrough.roughen(svg, { textBackground: true });                       // weiß
mlcrough.roughen(svg, { textBackground: '#fffdf5' });                  // eine Farbe
mlcrough.roughen(svg, { textBackground: { fill: '#fff', padding: 1.5, opacity: 0.85 } });
```

Wie genau die Platte sitzt, hängt davon ab, was darunter liegt. Ein
`<foreignObject>` — dort legt Mermaid seine Beschriftungen ab — nennt seine
Breite und Höhe selbst, dieser Fall ist exakt. Ein `<text>` tut das nicht, und
seine tatsächliche Ausdehnung auszurechnen bräuchte Font-Metriken: genau das,
was eine Bibliothek ohne DOM und ohne Canvas nicht hat. Dort wird geschätzt, aus
Schriftgröße und Zeichenzahl bei 0,55 em mittlerer Vorschubbreite. Das trägt
für eine gewöhnliche Proportionalschrift und sitzt bei einer schmalen oder
dicktengleichen Schrift sichtbar daneben.

## Reproduzierbarkeit

`roughen()` hat, anders als die Zeichenfunktionen aus Kapitel 2, einen **festen
Seed als Voreinstellung**. Derselbe Eingabetext ergibt dieselben Bytes, Lauf für
Lauf. Das ist die richtige Vorgabe für einen Filter in einer Pipeline: Sonst
erzeugte jeder Build einen Diff. `seed: 0` schaltet auf frischen Zufall bei
jedem Lauf um.
