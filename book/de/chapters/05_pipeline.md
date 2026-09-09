# Kapitel 5: In einer Pipeline

Die interessanten Eingaben für `roughen()` erzeugt ein anderes Programm.
Deshalb gibt es die Bibliothek auch als Kommandozeilenwerkzeug.

```bash
npx mlcrough diagramm.svg -o skizze.svg
npx mlcrough --fill-style solid --roughness 2 chart.svg > skizze.svg
cat chart.svg | npx mlcrough --seed 0 > skizze.svg
```

Womit die ganze Sache eine Zeile in einem Makefile wird:

```bash
mmdc -i graph.mmd -o graph.svg && mlcrough graph.svg -o skizze.svg
```

Optionen nehmen beide Schreibweisen, `--flag wert` und `--flag=wert`. Die
angehängte Form braucht man dort, wo ein Wert weggelassen werden darf:
`--text-background` allein bedeutet weiß, `--text-background=#fffdf5` eine
Farbe. `mlcrough --help` listet alles auf.

## Ohne Browser, in einem Prozess

Wenn das erzeugende Werkzeug selbst eine JavaScript-Bibliothek ohne
DOM-Abhängigkeit ist, entfällt sogar die Zwischendatei:

```typescript
import { MLTimeGraph, SVGRenderer } from 'ml-time-graph';
import mlcrough from 'mlcrough';

const chart = new MLTimeGraph({ width: 760, height: 380, series });
const { content } = new SVGRenderer().render(chart.renderCommands());

const skizze = mlcrough.roughen(content, { roughness: 1.3, seed: 7 });
```

Daten → Diagramm → SVG → Skizze, als Folge von Funktionsaufrufen. Kein
Headless-Chrome, keine temporäre Datei, kein Wartepunkt. Das Diagramm in
Kapitel 3 entsteht genau so.

## Abbildungen, die nicht veralten können

Alle Bilder in diesem Handbuch werden von einem Skript erzeugt, das dieselben
Codepfade benutzt wie die Beispiele der Bibliothek. Das ist keine Spielerei,
sondern die einzige Bauart, bei der ein Handbuch nicht langsam falsch wird: Ein
eingefügter Screenshot stimmt nach dem nächsten Release nicht mehr, und niemand
merkt es.

Damit das trägt, müssen zwei Dinge zusammenkommen. Erstens ein fester Seed,
sonst erzeugt jeder Lauf ein anderes Bild und jeder Build einen Diff — `roughen()`
hat ihn deshalb voreingestellt. Zweitens eine Prüfung, die anschlägt, wenn
jemand den Code ändert und die Bilder nicht: Die CI dieses Projekts erzeugt sie
neu und schlägt fehl, falls sich dabei etwas ändert.

## Zwei Fassungen für zwei Untergründe

Diese Seite ist dunkel, auf Wunsch hell. Ein Bild, das für einen der beiden
Fälle gemacht ist, sieht im anderen falsch aus — am deutlichsten bei einem
weißen Kasten auf dunklem Grund.

Die Abbildungen liegen deshalb doppelt vor: Der schlichte Name trägt die dunkle
Fassung, `<name>.light.svg` die helle. Keine der beiden hat einen eigenen
Hintergrund; den liefert die Seite. Wo die Farben aus dem Quelldokument stammen
— bei Mermaid etwa — braucht es dafür zwei Läufe des erzeugenden Werkzeugs,
denn dessen Thema steckt im Dokument.

## Grenzen

Drei Dinge kann `roughen()` heute nicht, und es ist besser, sie zu kennen, als
sie zu entdecken:

- **`<use>` wird übersprungen.** Wer ein Element referenziert statt es
  hinzuschreiben — Exporte aus Figma, Illustrator und Inkscape tun das gern —,
  bekommt es unverändert zurück. Das Ergebnis ist dann halb skizziert, was
  unangenehmer ist als ein klarer Fehlschlag.
- **Relative Maße werden übergangen.** Eine Form mit `width="50%"` bleibt, wie
  sie ist: Es gibt an dieser Stelle keinen Viewport, gegen den sich das auflösen
  ließe.
- **Externe Stylesheets werden nicht geladen.** Aufgelöst wird, was im Dokument
  steht.
