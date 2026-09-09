# Kapitel 1: Zwei Wege

MLCRough zeichnet so, wie ein Mensch mit einem Stift zeichnet: Linien treffen
sich nicht ganz, Kanten sind zweimal nachgezogen, Flächen sind schraffiert
statt gefüllt. Die Bibliothek ist ein Fork von
[Rough.js](https://github.com/pshihn/rough) von Preet Shihn, und dieser Teil
stammt von dort.

Was hier hinzukam, sind zwei Dinge. Das erste ist eine Streichung: **alle
Abhängigkeiten von DOM und Canvas sind entfernt.** Die Bibliothek erzeugt
Zeichenketten, keine Elemente. Sie läuft damit in Node, im Browser, in einem
Worker, in einem Build-Schritt.

Das zweite folgt daraus, und ist der eigentliche Grund für dieses Handbuch.

## Der erste Weg: Formen beschreiben

Man sagt der Bibliothek, was sie zeichnen soll.

```typescript
import mlcrough from 'mlcrough';

const rc = mlcrough.svgString();
const node = rc.rectangle(10, 10, 200, 120, { fill: '#7c3aed' });

console.log(mlcrough.serialize(node));
```

Heraus kommt eine Gruppe aus Pfaden — kein `<rect>`, denn ein handgezeichnetes
Rechteck ist keines mehr. Vier Kanten, jede zweimal gezogen und jede ein wenig
daneben, dazu die Schraffur der Füllung.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/shapes.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;aspect-ratio:3.6">
<img src="/books/mlcrough/images/shapes.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;aspect-ratio:3.6" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Rechteck, Kreis, Polygon und ein Pfad — jeweils mit einem anderen Füllstil. Kapitel 2 geht die Formen einzeln durch.</figcaption>
</figure>

## Der zweite Weg: ein fertiges SVG hineingeben

Der erste Weg setzt voraus, dass man die Zeichnung selbst in der Hand hat. Das
ist oft nicht so. Das Diagramm kommt aus Mermaid, das Schaubild aus Graphviz,
das Chart aus einer Diagrammbibliothek — fertiges SVG, das nur anders aussehen
soll.

```typescript
const skizze = mlcrough.roughen(svgText, { roughness: 1.4 });
```

`roughen()` liest ein fertiges Dokument, ersetzt jede Form durch ihre
handgezeichnete Fassung und lässt alles andere unangetastet. Das ist der Punkt,
an dem die entfernte DOM-Abhängigkeit vom Detail zur Voraussetzung wird: Die
interessanten Eingaben stammen von anderen Programmen, und die ganze Kette soll
auf einem Server, in einer Pipeline oder in einem Dokumentations-Build laufen —
ohne Browser.

<figure style="margin:2rem 0">
<div style="border-radius:8px;padding:12px">
<img src="/books/mlcrough/images/pipeline_rough.svg" class="fig-dark" alt="" loading="lazy" style="width:100%;max-width:460px;display:block;margin:0 auto;aspect-ratio:0.703">
<img src="/books/mlcrough/images/pipeline_rough.light.svg" class="fig-light" alt="" loading="lazy" style="width:100%;max-width:460px;display:block;margin:0 auto;aspect-ratio:0.703" aria-hidden="true">
</div>
<figcaption style="font-size:.9em;opacity:.75;margin-top:.6rem;line-height:1.5">Was <code>roughen()</code> tut, gezeichnet von Mermaid — und anschließend von <code>roughen()</code>. Kapitel 3 geht diesen Ablauf durch.</figcaption>
</figure>

## Was das Handbuch nicht behauptet

Eine skizzierte Darstellung ist kein Dekor. Sie sagt etwas aus, und zwar: *das
hier ist vorläufig.* Ein Entwurf, eine Schätzung, ein Vorschlag, über den noch
geredet wird. Für einen Messbericht oder eine Bilanz ist sie die falsche Wahl —
dort behauptet die saubere Linie zu Recht Genauigkeit.

Der Nutzen liegt genau dort, wo die saubere Linie zu viel verspricht.
